/* groovylint-disable-next-line CompileStatic */
pipeline {
  agent any

  tools {nodejs '{your_nodejs_configured_tool_name}'}

  stages {
    stage('Install Postman CLI') {
      steps {
        sh 'curl -o- "https://dl-cli.pstmn.io/install/linux64.sh" | sh'
      }
    }

    stage('Postman CLI Login') {
      steps {
        sh 'postman login --with-api-key $POSTMAN_API_KEY'
      }
    }

    stage('Running collection') {
      steps {
        script {
          // Generate a random email
          def int randomNumber = (1000..9999).random()
          def string email = "user${randomNumber}@example.com"

          // Replace the variable in the collection file
          sh "sed -i 's/{{email}}/${email}/g' collection.json"

          // Define the environment file path
          def string environmentFile = "path/to/environment.json"

          // Run the modified collection file with the environment
          sh "postman collection run collection.json -e ${environmentFile}"
        }
      }
    }
    stage('Create Payment Method') {
      steps {
        sh 'postman collection run "28422780-572d16ed-4a7d-48a6-a03c-e4a6c415494d" -e "28422780-e0f7e46f-d0a7-484b-b5c4-241a574bdd9e" --iteration-data "data/create_payment_method.json"'
      }
    }

    stage('Retrieve Payment Method') {
      steps {
        sh 'postman collection run "28422780-572d16ed-4a7d-48a6-a03c-e4a6c415494d" -e "28422780-e0f7e46f-d0a7-484b-b5c4-241a574bdd9e" --iteration-data "data/retrieve_payment_method.json" --dependsOn "Create Payment Method"'
      }
    }

    stage('Update Payment Method') {
      steps {
        sh 'postman collection run "28422780-572d16ed-4a7d-48a6-a03c-e4a6c415494d" -e "28422780-e0f7e46f-d0a7-484b-b5c4-241a574bdd9e" --iteration-data "data/update_payment_method.json" --dependsOn "Retrieve Payment Method"'
      }
    }

    stage('Delete Payment Method') {
      steps {
        sh 'postman collection run "28422780-572d16ed-4a7d-48a6-a03c-e4a6c415494d" -e "28422780-e0f7e46f-d0a7-484b-b5c4-241a574bdd9e" --iteration-data "data/delete_payment_method.json" --dependsOn "Update Payment Method"'
      }
    }
  }
}

