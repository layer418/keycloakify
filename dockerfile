# Use the official Maven image as the base image
FROM maven:3.8.4-openjdk-11

WORKDIR /keycloakify-starter

# Install Node.js
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs

RUN npm i yarn -g

# Verify installations
RUN mvn -v && \
    node -v && \
    npm -v && \
    yarn -v

# Copy the application files
COPY . .

RUN yarn
RUN yarn build-keycloak-theme

# Keep the container running
CMD ["tail", "-f", "/dev/null"]