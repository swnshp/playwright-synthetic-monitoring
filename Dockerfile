# Use official Node LTS image
FROM mcr.microsoft.com/playwright:v1.56.1-noble

# Set working directory
WORKDIR /app

# Copy package.json & package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the project
COPY . .


# Run Playwright tests on container start
CMD ["npx", "playwright", "test", "--reporter=list"]