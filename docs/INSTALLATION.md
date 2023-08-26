## Installation Guide

This guide will walk you through the steps to install the necessary dependencies to run the application. If you are using Docker, you can skip this guide and follow the instructions in the [Development with Docker](./DEVELOPMENT.md#development-with-docker) section of the development guide.

#### Dependencies

- [Node.js](https://nodejs.org/en/download/) (version 16 or higher)
  Please note that the Docker image used contains Node.js version 16.17.0-bullseye.

- [Yarn](https://classic.yarnpkg.com/en/docs/install) (version 1.22 or higher)
  Please note that the Docker image used contains Yarn version 1.22.19.

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) (version 2 or higher)

- [Stripe CLI](https://stripe.com/docs/stripe-cli#install) (version 1.8 or higher)

- [Optional] [MongoDB](https://docs.mongodb.com/manual/installation/) (version 4.4 or higher)
- [Optional] [MongoDB Compass](https://www.mongodb.com/try/download/compass) (version 1.28 or higher)

---

### Windows

**Stripe CLI**

- Download the latest version of the Stripe CLI for Windows from the official Stripe CLI repository: [Stripe CLI Releases](https://github.com/stripe/stripe-cli/releases).

- Extract the downloaded ZIP file to a directory of your choice.

- Add the directory containing the **stripe.exe** file to your system's PATH environment variable.

- Open a new command prompt or PowerShell window and verify the installation by running the following command:

```bash
stripe version
```

**AWS CLI**

- Download the AWS CLI installer for Windows from the official AWS CLI website: [AWS CLI Downloads](https://aws.amazon.com/cli/).

- Run the downloaded installer and follow the installation prompts.

- Open a new command prompt or PowerShell window and verify the installation by running the following command:

```bash
aws --version
```

<br>

### macOS

**Stripe CLI**

- Open a terminal and run the following command to install the Stripe CLI using **homebrew** (to install homebrew, follow the instructions on the [homebrew website](https://brew.sh/)):

```bash
brew install stripe/stripe-cli/stripe
```

- Verify the installation by running the following command:

```bash
stripe version
```

**AWS CLI**

- Open a terminal and run the following command to install the AWS CLI using **homebrew** (to install homebrew, follow the instructions on the [homebrew website](https://brew.sh/)):

```bash
brew install awscli
```

- Verify the installation by running the following command:

```bash
aws --version
```

---

All done! You can now follow the instructions in the [Development Guide](./DEVELOPMENT.md) to set up the project for development.
