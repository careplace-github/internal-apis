# CRM

## Getting Started  

This guide will help you on how to set up everything so that you can start working on this project. 
<br> <br> <br>

## Setting up Git
1) [Download and install the latest version of Git](https://git-scm.com/downloads). <br> <br>

2) Change the current working directory to the local repository where you want to configure this repository. <br> <br>

3) Set a Git username:\
`$ git config user.name "Mona Lisa"` <br> <br>

4) Confirm that you have set the Git username correctly:\
`$ git config user.name`\
`> Mona Lisa` <br> <br>

5) Set a Git email:\
`$ git config user.email "email@carely.pt"` <br> <br>

6) Confirm that you have set the Git email correctly:\
`$ git config user.email`\
`> email@carely.pt` <br> <br>

<br>

## Setting up SSH Key


1) Open Terminal.  <br> <br>
 
2) Paste the text below, substituting in your GitHub email address.\
`$ ssh-keygen -t ed25519 -C "your_email@example.com"`
\
\
This creates a new SSH key, using the provided email as a label.\
`Generating public/private algorithm key pair.`
\
\
When you're prompted to "Enter a file in which to save the key," press Enter. This accepts the default file location.\
`> Enter a file in which to save the key (/c/Users/you/.ssh/id_algorithm):[Press enter]`
\
\
At the prompt, type a secure passphrase. For more information, see ["Working with SSH key passphrases"](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/working-with-ssh-key-passphrases).\
`> Enter passphrase (empty for no passphrase): [Type a passphrase]`\
`> Enter same passphrase again: [Type passphrase again]` <br> <br>


3) Ensure the ssh-agent is running. You can use the "Auto-launching the ssh-agent" instructions in "Working with SSH key passphrases", or start it manually:\
`# start the ssh-agent in the background`\
`$ eval "$(ssh-agent -s)"` \
`> Agent pid 59566` <br> <br>

4) Add your SSH private key to the ssh-agent. If you created your key with a different name, or if you are adding an existing key that has a different name, replace id_ed25519 in the command with the name of your private key file.\
`$ ssh-add ~/.ssh/id_ed25519` <br> <br>

5) Add the SSH key to your account on GitHub. For more information, see ["Adding a new SSH key to your GitHub account"](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/adding-a-new-ssh-key-to-your-github-account). <br> <br>

<br>

## Setting up the Repository

1) Download Node.js [v16.16.0](https://nodejs.org/en/download/releases/)<br> <br>

2) Change the current working directory to the local repository where you want to configure this repository. <br> <br>

3) Paste the text below.\
`git clone git@github.com:CarelyPT/CRM.git` <br> <br>

4) Install dependencies\
`npm install` <br> <br>

5) Start the Node.js Server:\
`nodemon server` <br> <br>

<br>


## Branches Workflow

This workflow consists of five types of branches, each with different roles:

- Master (aka Production branch)
- feature branches 
- release branch
- hotfix branch
- develop branch (aka Integration branch) <br>
<br>

![](https://backlog.com/app/themes/backlog-child/assets/img/guides/git/collaboration/branching_workflows_001.png) <br> <br> <br>



#### Features

When you start working on a new feature/bug fix, you should create a feature/topic branch. A feature/topic branch is normally created off a develop/integration branch. This feature/topic branch can reside in your local machine throughout the entire development lifecycle of the feature.

You will push this branch to the remote repository whenever you are ready to merge the change set with the develop branch. 

When merging the change with the develop branch use `git merge --no-ff` to avoid fast forwarding so that the branch history is visible on the graph: <br>
<br>
![](https://i.stack.imgur.com/pPQd7.png)
<br> <br> <br>

#### Release

When you roll out a new release, you create a release branch. A release branch helps you to ensure that the new features are running correctly.

By convention, release branch names normally start with the prefix "release-".

The release branch is typically created off the develop/integration branch when it's close to being production-ready.

Only bug fixes and release related issues should be addressed on this branch. Having this branch will allow other team members to continue pushing new features to the develop/integration branch without interrupting the release workflow.

When you are ready to release, merge the release branch with the master branch and tag a release number to the newly created merge commit.

You should also merge the release branch with the develop/integration branch so that both the master and develop/integration branches receive the latest changes/bug fixes from the release branch. <br> <br>

#### Hotfix

When you need to add an important fix to your production codebase quickly, you can create a Hotfix branch off the master branch.

By convention, hotfix branch names normally start with the prefix "hotfix-".

The advantage of a hotfix branch is that it allows you to quickly issue a patch and have the change merged with the master branch without having to wait for the next release.

A hotfix branch should be merged with the develop/integration branch as well. <br> <br>

#### Develop

A develop/integration branch should be kept stable at all times. This is important because new branches are created off of this branch, and this branch could eventually go out live on production. Continuous integration tools such as Jenkins can be used to help do just that.

When some changes need to be merged into the develop/integration branch, it is generally a good idea to create a feature/topic branch to work on independently. <br> <br> <br>


## Branch Naming

When creating a new feature/bug fix/hot fix branch, respecting the workflow previously explained, use grouping tokens at the beginning of your branch names followed by a small description.

Choose one of the following tokens to every one of your branch names:
- **feat**: feature I'm adding or expanding
- **bug**: bug fix or hot fix
- **junk**: throwaway branch created to experiment

When creating a feature branch after the token use the ticket ID of the task (from GitHub Projects Cards).
If it's a bug branch and theres an issue open use the issue tracker ID.

Here are two examples: <br>
`feat-22/authentication`\
`bug-1/payment-information-only-shows-after-refresh` <br> <br> <br>

## Copyright

Every piece of software developed in this repository is intelectual property of Carely, Lda. <br>
Please make sure to insert the following copyright notice on every file:
<br>
```
/*  
 * [EN]
 *
 * Copyright (C) Carely, Lda - All Rights Reserved
 *
 * Unauthorized copying or distributing of this file via any medium is 
 * strictly prohibited.
 * This file is confidential and intellectual property of Carely, Lda.
 * For more information visit www.carely.pt or get in contact at 
 * contact@carely.pt
 * 
 * © 2022 Carely. All Rights Reserved.
 * 
 * 
 * [PT]
 * 
 * Copyright (C) Carely, Lda - Todos os direitos reservados
 *
 * A cópia ou distribuição não autorizada deste ficheiro por qualquer 
 * meio é estritamente proibida.
 * Este ficheiro é confidencial e parte da propriedade intelectual da
 * Carely, Lda.
 * Para mais informações visite www.carely.pt ou entre em contacto 
 * em contact@carely.pt 
 * 
 * © 2022 Carely. Todos os direitos reservados. 
 */
```

<br> <br> <br>

## License

Copyright © 2022 [Carely](https://www.carely.pt) - All Rights Reserved




