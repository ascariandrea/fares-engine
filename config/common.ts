
export abstract class Config {

  public koaPort = 8001;
  public prettyLogs = true;

  public database = {
    username: "root",
    password: null,
    host: "localhost",
    name: "fares"
  }

}
