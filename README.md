# CRM

[![Build Status][action-image]][action-url]
[![codecov][codecov-image]][codecov-url]
[![NPM version][npm-image]][npm-url]
[![License][license-image]][license-url]
[![minisize][min-image]][min-url]


[action-image]: https://github.com/mikbry/material-ui-color/workflows/Build%20and%20Deploy/badge.svg
[action-url]: https://carely.pt

[codecov-image]: https://codecov.io/gh/mikbry/material-ui-color/branch/master/graph/badge.svg?token=K4P0vnM5fh
[codecov-url]: https://codecov.io/gh/mikbry/material-ui-color

[npm-image]: https://img.shields.io/npm/v/material-ui-color.svg
[npm-url]: https://npmjs.org/package/material-ui-color

[license-image]: https://img.shields.io/github/license/mikbry/material-ui-color
[License-url]:""https://github.com/mikbry/material-ui-color/blob/master/LICENSE""

[min-image]:https://badgen.net/bundlephobia/min/material-ui-color
[min-url]:https://bundlephobia.com/result?p=material-ui-color



## Getting Started  

This guide will help you on how to set up everything so that you can start working on this project. 
<br>

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
`nodemon server`

<br>


## Branches Workflow

This workflow consists of five types of branches, each with different roles:

- Master (aka Production branch)
- feature branches 
- release branch
- hotfix branch
- develop branch (aka Integration branch)

![](https://backlog.com/app/themes/backlog-child/assets/img/guides/git/collaboration/branching_workflows_001.png)


#### Master
Codebase residing in the master branch is considered to be production-ready. When it is ready for a specific release, the latest commit will be given a release tag. <br> <br>

#### Features

When you start working on a new feature/bug fix, you should create a feature/topic branch. A feature/topic branch is normally created off a develop/integration branch. This feature/topic branch can reside in your local machine throughout the entire development lifecycle of the feature.

You will push this branch to the remote repository whenever you are ready to merge the change set with the develop/integration branch. <br> <br>

#### Release

When you roll out a new release, you create a release branch. A release branch helps you to ensure that the new features are running correctly.

By convention, release branch names normally start with the prefix "release-".

The release branch is typically created off the develop/integration branch when it's close to being production-ready.

Only bug fixes and release related issues should be addressed on this branch. Having this branch will allow other team members to continue pushing new features to the develop/integration branch without interrupting the release workflow.

When you are ready to release, merge the release branch with the master branch and tag a release number to the newly created merge commit.

You should also merge the release branch with the develop/integration branch so that both the master and develop/integration branches receive the latest changes/bug fixes from the release branch.

#### Hotfix

When you need to add an important fix to your production codebase quickly, you can create a Hotfix branch off the master branch.

By convention, hotfix branch names normally start with the prefix "hotfix-".

The advantage of a hotfix branch is that it allows you to quickly issue a patch and have the change merged with the master branch without having to wait for the next release.

A hotfix branch should be merged with the develop/integration branch as well. <br> <br>

#### Develop

A develop/integration branch should be kept stable at all times. This is important because new branches are created off of this branch, and this branch could eventually go out live on production. Continuous integration tools such as Jenkins can be used to help do just that.

When some changes need to be merged into the develop/integration branch, it is generally a good idea to create a feature/topic branch to work on independently.








