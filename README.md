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


#### 1) Setting up Git
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

#### 2) Setting up SSH Key


1) Open Terminal.  <br> <br>
 
2) Paste the text below, substituting in your GitHub email address.\
`$ ssh-keygen -t ed25519 -C "your_email@example.com"`
\
This creates a new SSH key, using the provided email as a label.\
`Generating public/private algorithm key pair.`
\
When you're prompted to "Enter a file in which to save the key," press Enter. This accepts the default file location.\
`> Enter a file in which to save the key (/c/Users/you/.ssh/id_algorithm):[Press enter]`
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

#### 3) Setting up the Repository

1) Change the current working directory to the local repository where you want to configure this repository. <br> <br>

2) Paste the text below.\
`git@github.com:CarelyPT/CRM.git` <br> <br>

<br>

#### 4. a) Setting up Frontend

- Install [Node.js](https://nodejs.org/en/download/)
- Recommended `node js 14.x` and `npm 6+`. (suggestion v14.17.3 / v16.15.0)
- - Change the current working directory to the <u> Frontend Directory </u>
- Install dependencies: `npm install`
- Start the React frontend server: `npm run start` 

<br>

#### 4. b) Setting up Backend

- Install [Node.js](https://nodejs.org/en/download/)
- Recommended `node js 14.x` and `npm 6+`. (suggestion v14.17.3 / v16.15.0)
- Change the current working directory to the <u> Backend Directory </u>
- Install dependencies: `npm install`
- Start the Node.js Server: `nodemon server` 

<br>











