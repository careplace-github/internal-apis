# Development Guide

This guide provides instructions for setting up the project for development. You have the option to develop with or without Docker.

---

## Development with Docker

Developing with Docker offers benefits such as environment consistency, isolation, and portability.
Using docker you can run the application in a containerized environment without having to install any dependencies on your machine. It also offers the benefit of being able to run the application in the same environment as it will be deployed in production.
Follow the steps below to set up the project using Docker:

1. Install Docker on your machine by following the instructions for your operating system: [Docker Installation Guide](https://docs.docker.com/get-docker/).

2. Clone the project repository:

   ```shell
   git clone <repository-url>
   cd <project-directory>
   ```

   Because this is a private repository, you will need to have SSH keys set up on your machine and have your SSH key added to your GitHub account. You can follow the instructions in the [Installation Guide](./INSTALLATION.md) for your operating system to set up SSH keys.
   Alternatively, you can download [GitHub Desktop](https://desktop.github.com/) and clone the repository through the application.

3. Copy the **.env.example** file and rename it to **.env.local**. Open the **.env.local** file and update the following environment variables:

   ```shell
     # .env.local
     AWS_ACCESS_KEY_ID=<your-aws-access-key-id>
     AWS_SECRET_ACCESS_KEY=<your-aws-secret-access-key>
     STRIPE_API_KEY=<your-stripe-api-key>
     STRIPE_DEVICE_NAME=<your-careplace-emplyee-id>
   ```

   By default the application will connect to the MongoDB Atlas cluster.
   If you would like to connect to a local MongoDB instance, you can update the **.env.local** file with the following environment variables:

   ```shell
     # .env.local
     MONGODB_USER=<your-mongodb-username>
     MONGO_PASSWORD=<your-mongodb-password>
     MONGODB_CONNECTION_STRING=mongodb://${MONGODB_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB_NAME}?retryWrites=true&w=majority
     MONGODB_CLUSTER_URI=<your-mongodb-cluster-uri>
   ```

4. Build the Docker image using Docker Compose:

   ```shell
    docker-compose -f .docker/docker-compose.dev.yml up --build
   ```

   This command will build the Docker image and run the application in development mode.
   You only need to run this command once (the image has a mounted volume so any changes you make to the code will be reflected in the container).
   After the image is built, you can run the application using the command in the next step.

5. Run the Docker container:

   ```shell
    docker-compose -f .docker/docker-compose.dev.yml up
   ```

   Alternatively, you can run the Docker container through the Docker Desktop application.

6. The application should now be running on [http://localhost:8080](http://localhost:8080). The documentation for the API endpoints can be found at [http://localhost:8080/api-docs](http://localhost:8080/api-docs).

7. In production, the docker imaage only installs the production dependencies. If you would like to test the production build locally, you can run the following command:

   ```shell
    docker-compose -f .docker/docker-compose.prod.yml up --build
   ```

   This command will build the Docker image and run the application in production mode.

## Development without Docker

Follow the steps below to set up the project without Docker:

1. Install the following dependencies on your machine:

   - [Node.js](https://nodejs.org/en/download/)
   - [Yarn](https://classic.yarnpkg.com/en/docs/install)
   - [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)
   - [Stripe CLI](https://stripe.com/docs/stripe-cli#install)

   You can follow the instructions in the [Installation Guide](./INSTALLATION.md) for your operating system to install the dependencies.

2. Clone the project repository:

   ```shell
    git clone <repository-url>
    cd <project-directory>
   ```

3. Open the **.env** file and update the following environment variables:

   ```shell
     # .env
     ACCESS_KEY_ID=<your-aws-access-key-id>
     SECRET_ACCESS_KEY=<your-aws-secret-access-key>
   ```

4. Install the project dependencies:

   ```shell
    yarn install
   ```

5. Run the application
   5.1. Run the application in development mode:

   ```shell
    yarn dev
   ```

   5.2. Run the application in production mode:

   ```shell
     yarn build
     yarn start
   ```

6. The application should now be running on [http://localhost:8080](http://localhost:8080). The documentation for the API endpoints can be found at [http://localhost:8080/api-docs](http://localhost:8080/api-docs).

<br />

**Note**:
The application is deployed in a Docker container in production. When Pull Requests are made to the develop branch, the CI pipeline will build the Docker image and run tests inside it. If you decide to develop without using Docker make sure you have the same version of NodeJs and Yarn otherwise it might happen that the application builds successfully on your local machine but the CI pipeline fails (please refer to the [Installation Guide](./INSTALLATION.md)). If this happens, you can check the logs of the CI pipeline to see which tests failed and fix them. If the tests fail the Pull Request will not be merged.
