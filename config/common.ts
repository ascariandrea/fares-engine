
export abstract class Config {

  public koaPort = 8002;
  public prettyLogs = true;

  public database = {
    username: "root",
    password: null,
    host: "localhost",
    name: "fares"
  }

}
