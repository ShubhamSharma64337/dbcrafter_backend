# Dbcrafter (Backend)

Before running this app, make sure you have the MongoDB Server installed and a database named dbcrafter with users and diagrams collection in it  

To run the project -  

1. Clone and cd into the repo  
2. Run <i>npm install</i>  
3. Run <i>npm start</i>  
  
Note:- If the project is going to be hosted on gcloud AppEngine, you must create an env_variables.yaml file and add the MongoDB Cloud's connection string to it as  

env_variables:
  MONGO_CONNECTION: <connection_string>  
