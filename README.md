British Rail Fares Engine [![Build Status](https://travis-ci.org/open-track/fares-engine.svg?branch=master)](https://travis-ci.org/open-track/fares-engine)
=========================

The British Rail Fares Engine is a library, API and user interface that can be used to return Britsh rail fares. 
 
It relies on data from [Rail Delivery Group](http://data.atoc.org). The rules around journey/fare validity are very specific to British rail and are not useful for other data sets. 

It does not test the validity of journeys as it has no concept of a journey. The [journey planner and fares service](https://www.github.com/open-track/jpaf) integrates fares from this fares engine with journeys from a journey planner and validates the two.

## Testing
 
```
npm test
```

## Run

```
npm run data-import /path/to/RJFAFxxx.ZIP #first run only
npm run data-clean 
npm start
```

## Contributing

Issues and PRs are very welcome. 

## License

This software is licensed under [GNU GPLv3](https://www.gnu.org/licenses/gpl-3.0.en.html).

Copyright 2017 Linus Norton.

