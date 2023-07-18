# SSH Key Setup

To access the private repository, you'll need to set up SSH keys on your development machine. Follow the steps below to generate and configure your SSH keys.
For more information, see the [GitHub Docs](https://docs.github.com/en/github/authenticating-to-github/connecting-to-github-with-ssh) on connecting to GitHub with SSH.

---

## Step 1: Check for Existing SSH Keys

1. Open a terminal or git bash window.

2. Run the following command to check if you have any existing SSH keys:

   ```shell
   ls -al ~/.ssh
   ```

3. Check the output to see if you have any existing SSH keys:
   - If you see files named **id_rsa.pub** or **id_dsa.pub**, you have an existing SSH key pair and can skip to **Step 3**.
   - If you don't see any existing SSH keys, continue to **Step 2**.

## Step 2: Generate a New SSH Key Pair

1. Run the following command to generate a new SSH key pair:

   ```shell
   ssh-keygen -t rsa -b 4096 -C "
   ```

   - Press **Enter** to accept the default file location.
   - Enter a secure passphrase when prompted.

2. Run the following command to start the ssh-agent in the background:
   ```shell
   eval "$(ssh-agent -s)"
   ```
3. Run the following command to add your SSH private key to the ssh-agent:
   ```shell
   ssh-add ~/.ssh/id_rsa
   ```
4. Run the following command to copy your SSH public key to your clipboard:
   ```shell
   clip < ~/.ssh/id_rsa.pub
   ```
5. In the upper-right corner of any page, click your profile photo, then click **Settings**.
6. In the user settings sidebar, click **SSH and GPG keys**.
7. Click **New SSH key** or **Add SSH key**.
8. In the **Title** field, add a descriptive label for the new key. For example, if you're using a personal Mac, you might call this key "Personal MacBook Air".
9. Paste your key into the **Key** field.
10. Click **Add SSH key**.
11. If prompted, confirm your GitHub password.

## Step 3: Add SSH Key to GitHub Account

1. Run the following command to copy your SSH public key to your clipboard:
   ```shell
   clip < ~/.ssh/id_rsa.pub
   ```
2. In the upper-right corner of any page, click your profile photo, then click **Settings**.
3. In the user settings sidebar, click **SSH and GPG keys**.
4. Click **New SSH key** or **Add SSH key**.
5. In the **Title** field, add a descriptive label for the new key. For example, if you're using a personal Mac, you might call this key "Personal MacBook Air".
6. Paste your key into the **Key** field.
7. Click **Add SSH key**.
8. If prompted, confirm your GitHub password.

## Step 4: Add SSH Key to GitHub Account

1. Run the following command to copy your SSH public key to your clipboard:
   ```shell
   clip < ~/.ssh/id_rsa.pub
   ```
2. In the upper-right corner of any page, click your profile photo, then click **Settings**.
3. In the user settings sidebar, click **SSH and GPG keys**.
4. Click **New SSH key** or **Add SSH key**.
5. In the **Title** field, add a descriptive label for the new key. For example, if you're using a personal Mac, you might call this key "Personal MacBook Air".
6. Paste your key into the **Key** field.
7. Click **Add SSH key**.
8. If prompted, confirm your GitHub password.

---

All done! You should now be able to clone the repository using SSH.
