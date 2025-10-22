# Variables
IMAGE_NAME=fastify-practice
PORT=3000

# Build Docker image
build:
    docker build -t $(IMAGE_NAME) .

# Run container
run:
    docker run -p $(PORT):$(PORT) $(IMAGE_NAME)

# Remove container and image
clean:
    docker rmi -f $(IMAGE_NAME)

# Rebuild and run
rebuild: clean build run
