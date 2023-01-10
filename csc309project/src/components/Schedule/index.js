// General component that feeds into StudioSchedule AND UserSchedule.
// Parameters are:
//  - studioIds: array of studio ids to fetch sessions for
//  - onlyEnrolled: boolean, if true, only show sessions for studios that the user is enrolled in
//  - showHistory: boolean, if true, show prior weeks as well

import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import SessionCard from "./SessionCard";
import getDaysForWeekNum from "./getDaysForWeekNum";
import getDayNamesToSessionsFromJson from "./getDayNamesToSessionsFromJson";
import wrappedConsoleLog from "../helpers/wrappedConsoleLog";
import './index.css';
import handleJsonResponseStatus from "../helpers/handleJsonResponseStatus";

const Schedule = ({studioIds, onlyEnrolled, showHistory}) => {
    wrappedConsoleLog("Schedule component being rendered with props:", {studioIds, onlyEnrolled, showHistory});

    const [weekNum, setWeekNum] = useState(0);
    const [days, setDays] = useState(getDaysForWeekNum(0));
    const [dayNamesToSessions, setDayNamesToSessions] = useState({
        'Sunday': [],
        'Monday': [],
        'Tuesday': [],
        'Wednesday': [],
        'Thursday': [],
        'Friday': [],
        'Saturday': []
    });
    const navigate = useNavigate();

    // Update days when weekNum changes
    useEffect(() => {
        setDays(getDaysForWeekNum(weekNum));
    }, [weekNum]);

    // Fetch the studio's schedule from the backend
    const fetchSchedule = async (studioIds) => {
        console.log('-'.repeat(50));
        console.log('FETCHING schedule for studioIds:', studioIds);

        for (let i = 0; i < studioIds.length; i++) {
            let studioId = studioIds[i];
            console.log(`\n\nFETCHING Schedule for studioId: ${studioId} (iteration ${i + 1} of ${studioIds.length})`);

            let url = `http://localhost:8000/studios/${studioId}/schedule/`
            await fetch(url, {
                method: 'GET',
                credentials: "same-origin",
                headers: {"Authorization": `Bearer ${localStorage.getItem('csrfAccess')}`},
            })
                .then(response => handleJsonResponseStatus(response, navigate))
                .then(async json => {
                    console.log('FETCH SUCCESSFUL, json:', json);
                    let dayNamesToSessions_new = await getDayNamesToSessionsFromJson(json, weekNum, onlyEnrolled);
                    wrappedConsoleLog('dayNamesToSessions_new:', dayNamesToSessions_new);

                    // console.log('i:', i);
                    // console.log('dayNamesToSessions:', dayNamesToSessions);
                    // console.log('dayNamesToSession_new:', dayNamesToSessions_new);
                    if (i === 0) {
                        // If this is the first studio, just set dayNamesToSessionsAllStudios to dayNamesToSessions_new
                        console.log('FINAL SETTING dayNamesToSessions to dayNamesToSessions_new');
                        setDayNamesToSessions(dayNamesToSessions_new);
                    }
                    else {
                        // Otherwise, merge dayNamesToSessions_new into dayNamesToSessions
                        console.log('FINAL MERGING dayNamesToSessions and dayNamesToSessions_new');
                        for (let dayName of Object.keys(dayNamesToSessions_new)) {
                            setDayNamesToSessions((prevDayNamesToSessions) => {
                                return {
                                    ...prevDayNamesToSessions,
                                    [dayName]: prevDayNamesToSessions[dayName].concat(dayNamesToSessions_new[dayName])
                                }
                            })
                        }
                    }

                    // handleSetDayNamesToSessions(dayNamesToSessions_new);
                    console.log('FETCH Finished SUCCESSFULLY\n' + '-'.repeat(50));
                }).catch(
                    error => console.error(error)
                );
        }
    };

    useEffect(() => {
        fetchSchedule(studioIds);
    }, []);

    // useEffect to fetch classes when week changes
    useEffect(() => {
        fetchSchedule(studioIds); // TODO: always have .then?
    }, [weekNum, studioIds]);

    // When dayNamesToSessions, re-order session so that they are in chronological order
    useEffect(() => {
        console.log('RE-ORDERING sessions in dayNamesToSessions');
        for (let dayName of Object.keys(dayNamesToSessions)) {
            dayNamesToSessions[dayName].sort((a, b) => {
                return a.sessionDateTime - b.sessionDateTime;
            });
        }
    }, [dayNamesToSessions]);

    function handlePreviousClick() {
        // Decrement the week number, do not go past 0 (do not show past classes)
        if (showHistory) {
            setWeekNum(weekNum - 1);
        } else {
            setWeekNum(Math.max(0, weekNum - 1));
        }
    }

    function handleNextClick() {
        // Increment the week number
        setWeekNum(weekNum + 1);
    }

    const getWeekdayColumnTitle = day => {
        return day.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric"
        });
    }
    const getWeekdayName = day => {
        return day.toLocaleDateString("en-US", {
            weekday: "long",
        });
    }

    // If showHistory, justify left, otherwise center
    const justifyContent = showHistory ? "left" : "center";

    // console.log('PRE_RENDER, dayNamesToSessions:', dayNamesToSessions);
    return (
        <div>
            {/* TODO: include? */}
            {/*<h2>Week of {getWeekdayColumnTitle(days[0])}</h2>*/}

            {/* Previous and next week buttons */}
            <div style={{fontSize: 18, display: 'flex', justifyContent: justifyContent, marginTop: 20}}>
                <button onClick={handlePreviousClick} style={{marginRight: 5}}>Previous Week</button>
                <button onClick={handleNextClick}>Next Week</button>
            </div>

            {/* A grid of days for the current week */}
            <div className="day-grid" style={{marginTop: 10}}>
                {days.map(day => (
                    <div className="day">
                        <h3>{getWeekdayColumnTitle(day)}</h3>
                        {/* A list of sessions for this day */}
                        <div className="session-list">
                            {dayNamesToSessions[getWeekdayName(day)].map(session => (
                                <SessionCard session={session} showPastNumEnrolled={!showHistory}/>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Schedule;