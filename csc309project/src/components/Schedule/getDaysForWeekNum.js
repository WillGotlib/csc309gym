const getDaysForWeekNum = (weekNum) => {
    // Create a date object referring to the first day of the current week
    const date = new Date();
    date.setDate(date.getDate() - date.getDay());
    // Return an array of Date objects, each representing a different day of the
    // current week in the order Sunday to Saturday
    return [...Array(7).keys()].map(
        i => new Date(date.getFullYear(), date.getMonth(), date.getDate() + i + (weekNum * 7))
    );
}

export default getDaysForWeekNum;