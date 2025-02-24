# Use Deno base image
FROM denoland/deno:latest

# Set working directory
WORKDIR /app

# Copy files into the container
COPY . .

# Expose API port
EXPOSE 8000

# Run the Deno server
CMD ["deno", "task", "start-local"]
