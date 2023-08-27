static async sendHomeCareOrderQuote(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const response: IAPIResponse = {
      statusCode: res.statusCode,
      data: {},
    };

    let accessToken: string;

    // Check if there is an authorization header
    if (req.headers.authorization) {
      // Get the access token from the authorization header
      accessToken = req.headers.authorization.split(' ')[1];
    } else {
      // If there is no authorization header, return an error
      return next(new HTTPError._401('Missing required access token.'));
    }

    const { order_total } = req.body;

    if (!order_total) {
      next(new HTTPError._400('Missing required fields.'));
    }

    const user = await AuthHelper.getUserFromDB(accessToken);

    if (!(user instanceof CollaboratorModel || user instanceof CaregiverModel)) {
      return next(new HTTPError._403('You do not have access to retrieve home care orders.'));
    }

    let healthUnitId = await AuthHelper.getUserFromDB(accessToken).then((user) => {
      if (!('health_unit' in user)) {
        return next(new HTTPError._403('You are not authorized to decline this order.'));
      }
      return user?.health_unit?._id.toString();
    });

    let order: IHomeCareOrderDocument;

    let orderId = req.params.id;

    try {
      order = await OrdersController.HomeCareOrdersDAO.queryOne({ _id: orderId }, [
        {
          path: 'patient',
          model: 'patient',
        },
        {
          path: 'health_unit',
          model: 'HealthUnit',
        },
        {
          path: 'services',
          model: 'Service',
        },
        {
          path: 'customer',
          model: 'Customer',
        },
      ]);
    } catch (error: any) {
      switch (error.type) {
        case 'NOT_FOUND': {
          return next(new HTTPError._404('Order not found.'));
        }

        default: {
          return next(new HTTPError._500(error.message));
        }
      }
    }

    if (
      healthUnitId !== order.health_unit._id.toString() ||
      !user?.permissions?.includes('orders_edit')
    ) {
      return next(new HTTPError._403('You are not authorized to send a quote for this order.'));
    }

    if (
      order.status === 'declined' ||
      order.status === 'cancelled' ||
      order.status === 'completed'
    ) {
      return next(new HTTPError._403('You are not authorized to send a quote for this order.'));
    }

    order.order_total = order_total;

    await OrdersController.HomeCareOrdersDAO.update(order);

    response.statusCode = 200;
    response.data = order;

    // Pass to the next middleware to handle the response
    next(response);

    /**
     * From 'services' array, get the services that are in the order
     */

    let orderServicesAux = order.services.map((serviceId) => {
      const service = services.find((service) => service._id.toString() === serviceId.toString());

      return service;
    });

    // Create a string with the services names
    // Example: "Cleaning, Laundry, Shopping"
    const orderServices = orderServicesAux
      .map((service) => {
        return service?.name;
      })
      .join(', ');

    let schedule = await DateUtils.getScheduleRecurrencyText(order.schedule_information.schedule);

    let birthdate = await DateUtils.convertDateToReadableString(
      (order.patient as IPatient).birthdate
    );

    let orderStart = await DateUtils.convertDateToReadableString2(
      order.schedule_information.start_date
    );
    let collaborators = (
      await OrdersController.CollaboratorsDAO.queryList({
        health_unit: { $eq: order.health_unit },
      })
    ).data;

    // Only send email to business users that have the 'orders_emails' permission
    collaborators = collaborators.filter((user) => {
      return user?.permissions?.includes('orders_emails');
    });

    const collaboratorsEmails = collaborators.map((user) => {
      if (user?.permissions?.includes('orders_emails')) {
        return user.email;
      }
    });

    let userEmailPayload = {
      name: (order.customer as ICustomer).name,
      healthUnit: order.health_unit.business_profile.name,

      link: `https://www.careplace.pt/checkout/orders/${order._id}`,

      subTotal: (order.order_total / 1.23 / 100).toFixed(2),
      taxAmount: ((order.order_total - order.order_total / 1.23) / 100).toFixed(2),
      total: (order.order_total / 100).toFixed(2),

      orderStart: orderStart,
      orderSchedule: schedule,
      orderServices: orderServices,

      patientName: (order.patient as IPatient).name,
      patientBirthdate: birthdate,
      patientMedicalInformation: (order.patient as IPatient)?.medical_conditions || 'N/A',

      patientStreet: (order.patient as IPatient).address.street,
      patientCity: (order.patient as IPatient).address.city,
      patientPostalCode: (order.patient as IPatient).address.postal_code,
      patientCountry: (order.patient as IPatient).address.country,
    };

    let marketplaceNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
      'marketplace_home_care_order_quote',
      userEmailPayload
    );

    if (
      !marketplaceNewOrderEmail ||
      !marketplaceNewOrderEmail.htmlBody ||
      !marketplaceNewOrderEmail.subject
    ) {
      return next(new HTTPError._500('Error while getting the email template.'));
    }

    await OrdersController.SES.sendEmail(
      [(order.customer as ICustomer).email],
      marketplaceNewOrderEmail.subject,
      marketplaceNewOrderEmail.htmlBody
    );

    // Send email to all collaborators that have the 'orders_emails' permission
    if (collaboratorsEmails && collaboratorsEmails.length > 0) {
      for (let i = 0; i < collaboratorsEmails.length; i++) {
        const collaboratorEmail = collaboratorsEmails[i];
        if (collaboratorEmail) {
          let healthUnitEmailPayload = {
            name: collaborators[i].name,
            healthUnit: order.health_unit.business_profile.name,

            link: `https://www.sales.careplace.pt/orders/${order._id}`,

            subTotal: (order.order_total / 1.23).toFixed(2),
            taxAmount: (order.order_total - order.order_total / 1.23).toFixed(2),
            total: order.order_total.toFixed(2),

            orderStart: orderStart,
            orderSchedule: schedule,
            orderServices: orderServices,

            patientName: (order.patient as IPatient).name,
            patientBirthdate: birthdate,
            patientMedicalInformation: (order.patient as IPatient)?.medical_conditions || 'N/A',

            patientStreet: (order.patient as IPatient).address.street,
            patientCity: (order.patient as IPatient).address.city,
            patientPostalCode: (order.patient as IPatient).address.postal_code,
            patientCountry: (order.patient as IPatient).address.country,

            userName: (order.customer as ICustomer).name,
            userPhone: (order.customer as ICustomer).phone,
          };

          let businessNewOrderEmail = await EmailHelper.getEmailTemplateWithData(
            'business_home_care_order_quote_sent',
            healthUnitEmailPayload
          );

          if (
            !businessNewOrderEmail ||
            !businessNewOrderEmail.htmlBody ||
            !businessNewOrderEmail.subject
          ) {
            return next(new HTTPError._500('Error while generating email template.'));
          }

          await OrdersController.SES.sendEmail(
            [collaboratorEmail],
            businessNewOrderEmail.subject,
            businessNewOrderEmail.htmlBody
          );
        }
      }
    }
  } catch (error: any) {
    // Pass to the next middleware to handle the error
    return next(new HTTPError._500(error.message));
  }
}
