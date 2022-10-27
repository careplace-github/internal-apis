FROM node:16

ENV HOME /usr/src/

WORKDIR $HOME

# copy the tarballs
COPY ["yarn-offline-mirror", "$HOME/yarn-offline-mirror/"]

# copy files needed for the install
COPY ["package.json", "yarn.lock", ".yarnrc", "$HOME/"]

# the offline flag will mean that an error is raised if any
# module needs to be fetched remotely. It can be removed to allow
# yarn to fetch any missing modules if that was to happen.
RUN yarn --offline --frozen-lockfile --link-duplicates

# copy the rest.. could be further broken up into multiple instructions
# for cache optimisation
COPY . $HOME

CMD ["yarn", "start"] 