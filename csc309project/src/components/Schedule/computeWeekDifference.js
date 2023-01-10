const computeWeekDifference = (date1, date2) => {
    const date2CopyTime = new Date(date2);
    date2CopyTime.setHours(date1.getHours(), date1.getMinutes(), date1.getSeconds());
    return Math.floor(Math.abs(date1.getTime() - date2CopyTime.getTime()) / (1000 * 60 * 60 * 24 * 7));
}

export default computeWeekDifference;