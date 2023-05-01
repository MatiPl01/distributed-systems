## Description
You can run all tasks either locally or on the distributed environment using the prepared Docker setup

### Running tasks locally
##### 1. Install the ray Python package
```shell
pip install "ray[default]"
```
##### 2. Uncomment lines with `1. Local development` comment above and comment out all other initialization lines
##### 3. Run the python script


### Running tasks on the distributed environment

#### 1. Running inside the docker container
##### 1.1. Uncomment lines with `2. Inside Docker Cluster` comment above and comment out all other initialization lines
##### 1.2. Navigate to the root directory of the project (`lab3/exercises`) in your terminal
##### 1.3. Build the docker image
The `Dockerfile` will be used to build the docker image. The image will be named `raylab`. All tasks files will be copied to the head docker container.
```shell
docker build -t raylab .
```
##### 1.4. Run the docker container with appropriate parameters
You need to be in the root directory of the project (`lab3/exercises`) to run the docker container. The configuration file `docker-compose.yml` will be used to run the docker container.
```shell
docker-compose up
```
##### 1.5. Run the python script
Find the container named `ray-head-1` in the list of running containers and enter it. Open the terminal inside the container and run the python script using the following command.
```shell
python <path_to_task_file>
```
Replace `<path_to_task_file>` with the path to the task file.

To get a list of Python script files use the following command.
```shell
ls
```


#### 2. Running scripts locally with ray running in the docker container
##### 2.1. Install the ray Python package
```shell
pip install "ray[default]"
```
##### 2.2. Uncomment lines with `3. Local development with Docker Cluster` comment above and comment out all other initialization lines
##### 2.3. Navigate to the root directory of the project (`lab3/exercises`) in your terminal
##### 2.4. Build the docker image
```shell
docker build -t raylab .
```
##### 2.5. Run the docker container with appropriate parameters
The exposed port `10001` should be used to connect to the ray cluster running inside the docker container.
```shell
docker-compose up
```
##### 2.6. Run the python script locally
The script will use the exposed port `10001` to connect to the ray cluster running inside the docker container.
