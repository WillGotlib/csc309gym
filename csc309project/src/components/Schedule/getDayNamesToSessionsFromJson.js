// Get an object mapping each weekday name to an array of the sessions
// occurring of the weekNum week.
import getDaysForWeekNum from "./getDaysForWeekNum";
import wrappedConsoleLog from "../helpers/wrappedConsoleLog";
import fetchNumEnrolled from "./fetchNumEnrolled";
import isUserEnrolledInSession from "./isUserEnrolledInSession";
import computeWeekDifference from "./computeWeekDifference";

const getDayNamesToSessionsFromJson = async (json, weekNum, onlyEnrolled) => {
    wrappedConsoleLog('In getDayNamesToSessionsFromJson method, json is', json);

    const weekdaysList = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];

    const dayNamesToSessionsNew = {
        'Sunday': [],
        'Monday': [],
        'Tuesday': [],
        'Wednesday': [],
        'Thursday': [],
        'Friday': [],
        'Saturday': []
    };

    // Date of the last day of the current week, 11:59:59 PM
    // Need to call getDaysForWeekNum and not just access days since days might not be up to date
    // (and in fact was not in my testing, causing bugs)
    const daysForWeekNum = getDaysForWeekNum(weekNum);
    const lastDay = new Date(daysForWeekNum[6]);
    lastDay.setHours(23, 59, 59);
    // console.log('DAYS:', daysForWeekNum);

    for (let class_ of json) {
        console.log('\n\n\nNew Outer Loop Iteration. CLASS:', class_)

        for (let classTime of class_.class_times) {
            console.log('\n\nNew Inner Loop Iteration. CLASS TIME:', classTime)

            // Get the start dateTime for this classTime
            let startDateTimeStr = `${classTime.start_date}T${classTime.time}`;
            console.log('START DATE TIME STR:', startDateTimeStr)
            let startDateTime = new Date(Date.parse(startDateTimeStr));
            console.log('START DATE TIME:', startDateTime)

            // If startDateTime is before Saturday at 11:59:59 PM (the last day of the current week), proceed
            console.log('LAST DAY:', lastDay);
            if (startDateTime <= lastDay) {
                console.log('START DATE TIME <= new Date(), proceed');

                // Now, get the session_num of this session (the session in weekNum week)
                let sessionDate = daysForWeekNum[weekdaysList.indexOf(classTime.day)];
                console.log('SESSION DATE (not necessarily same time):', sessionDate);
                let sessionDateTime = new Date(sessionDate);
                // Set time of sessionDateTime to the time in the classTime.time field (string)
                sessionDateTime.setHours(...classTime.time.split(':').map(x => parseInt(x)));
                console.log('SESSION DATE TIME:', sessionDateTime);
                let sessionNum = computeWeekDifference(startDateTime, sessionDateTime);
                console.log('SESSION NUM:', sessionNum);

                // Now, check if the sessionNum has been cancelled
                let cancelled = false;
                for (let cancelledSession of classTime.specific_session_cancellations) {
                    if (cancelledSession.session_num === sessionNum) {
                        cancelled = true;
                        break;
                    }
                }
                console.log('CANCELLED:', cancelled);

                // If the session is not cancelled, add it to the dayNamesToSessionsNew object
                if (!cancelled) {
                    console.log('SESSION NOT CANCELLED, ADDING TO dayNamesToSessionsNew');

                    let session = {};
                    session['studioId'] = class_.studio.id;
                    session['studioName'] = class_.studio.name;
                    session['name'] = class_.name;
                    session['capacity'] = class_.capacity;
                    session['description'] = class_.description;
                    session['coach'] = class_.coach;
                    session['day'] = classTime.day;
                    session['keywords'] = class_.keywords;
                    session['time'] = classTime.time;
                    session['duration'] = classTime.duration;
                    session['id'] = classTime.id;
                    session['sessionNum'] = sessionNum;
                    session['sessionDateTime'] = sessionDateTime;
                    session['past'] = sessionDateTime < new Date(); // True if in past, false if in future

                    // Fetch and include num_enrolled info
                    session['num_enrolled'] = await fetchNumEnrolled(classTime.id, sessionNum);
                    console.log('ENROLLED NUM:', session['num_enrolled']);

                    // Compute and include where user is enrolled in session
                    session['is_enrolled'] = isUserEnrolledInSession(
                        classTime, sessionNum, session.name, sessionDateTime
                    );
                    console.log('IS ENROLLED:', session['is_enrolled']);

                    console.log('*Final SESSION OBJECT*:', session)
                    // console.log('SESSION DAY:', classTime.day)

                    // If onlyEnrolled is true, only add the session to the correct day if the user is enrolled
                    let addedMsg = 'ADDED SESSION TO dayNamesToSessionsNew, ' +
                        'finished inner loop iteration (CLASS TIME)!';
                    if (onlyEnrolled) {
                        if (session['is_enrolled']) {
                            dayNamesToSessionsNew[classTime.day].push(session);
                            console.log(addedMsg);
                        }
                    } else {
                        dayNamesToSessionsNew[classTime.day].push(session);
                        console.log(addedMsg);
                    }
                }
            }
        }
    }
    return dayNamesToSessionsNew;
};

export default getDayNamesToSessionsFromJson;