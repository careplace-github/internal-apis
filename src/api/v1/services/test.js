const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();


// Accept a POST with a JSON structure containing the
// refresh token provided during the original user login, 
// and an old and new password.
function changeUserPassword(event, context, callback) {
  // Extract relevant JSON into a request dict (This is my own utility code)
  let requiredFields = ['old_password','new_password','refresh_token'];
  let request = Utils.extractJSON(event['body'], requiredFields);
  if (request == false) {
    Utils.errorResponse("Invalid JSON or missing required fields", context.awsRequestId, callback);
    return; // Abort here
    }


  // This function can NOT be handled by admin APIs, so we need to
  // authenticate the user (not the admin) and use that
  // authentication instead.
  let refreshToken = request['refresh_token']

  // Authenticate as the user first, so we can call user version
  // of the ChangePassword API
  cognitoidentityserviceprovider.adminInitiateAuth({
    AuthFlow: 'REFRESH_TOKEN',
    ClientId: Config.ClientId,
    UserPoolId: Config.UserPoolId,
    AuthParameters: {
      'REFRESH_TOKEN': refreshToken
    },
    ContextData: getContextData(event)
  }, function(err, data) {
    if(err){
      Utils.errorResponse(err['message'], context.awsRequestId, callback);
      return // Abort here
    } else {
      // Now authenticated as user, change the password
      let accessToken = data['AuthenticationResult']['AccessToken'] // Returned from auth - diff signature than Authorization header
      let oldPass = request['old_password']
      let newPass = request['new_password']
      let params = {
        AccessToken: accessToken, /* required */
        PreviousPassword: oldPass, /* required */
        ProposedPassword: newPass /* required */
      }

      // At this point, really just a pass through
      cognitoidentityserviceprovider.changePassword(params, function(err2, data2) {
        if(err2){
          let message = {
            err_message: err2['message'],
            access_token: accessToken
          }
          Utils.errorResponse(message, context.awsRequestId, callback);
        } else {
          let response = {
            'success': 'OK',
            'response_data': data2 // Always seems to be empty
          }
          callback(response)
        }
      });
    }
  });

}