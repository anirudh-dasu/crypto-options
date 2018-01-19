export const getCurrentCandleEndTime = () => {
    var moment = require('moment');
    var end = moment.utc().endOf('hour').unix();
    return end;
}
  
export const getCurrentCandleEndsIn = () => {
    var moment = require('moment');
    var end = moment.utc().endOf('hour').unix();
    return (end - moment.utc().unix())
}

export const getNextCandleStartsIn = () => {
    getCurrentCandleEndsIn();
}

export const getNextCandleStartTime = () => {
    getCurrentCandleEndTime();
}