British Rail Fares Engine [![Build Status](https://travis-ci.org/open-track/fares-engine.svg?branch=master)](https://travis-ci.org/open-track/fares-engine)
=========================

The British Rail Fares Engine is a library, API and user interface that can be used to return Britsh rail fares. 
 
It relies on data from [Rail Delivery Group](http://data.atoc.org). The rules around journey/fare validity are very specific to British rail and are not useful for other data sets. 

It does not test the validity of journeys as it has no concept of a journey. The [journey planner and fares service](https://www.github.com/open-track/jpaf) integrates fares from this fares engine with journeys from a journey planner and validates the two.

## Testing
 
```
npm test
```

## Setup

It is assumed that MySQL is installed locally and there is a database called `fares` set up. The database credentials can be overriden by setting environment variables `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_HOST` `DATABASE_NAME`.

If you have a username and password for DTD you can set the credentials with `SFTP_USERNAME` and `SFTP_PASSWORD`, you can also override the host with `SFTP_HOSTNAME`.

```
SFTP_USERNAME=dtd_username SFTP_PASSWORD=dtd_password npm run data-download
npm run data-clean 
```

## Run

Starting the service will load some data into memory (~30 seconds) and then start the service on port 8002. Browsing `http://localhost:8002` will display the test user interface.

```
npm start
```

## Contributing

Issues and PRs are very welcome. 

## License

This software is licensed under [GNU GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html).

Copyright 2017 Linus Norton.

