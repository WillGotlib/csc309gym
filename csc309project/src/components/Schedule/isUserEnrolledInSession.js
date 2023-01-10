const isUserEnrolledInSession = (classTime, session_num, sessionName, sessionDateTime) => {
    // Function Logic:
    // Check if the user has an individual enrollment for this class time (if yes return true)
    // If not, check if the user has an active (end_datetime is not null) recurring enrollment for this class time
    //  If yes, check if the user has dropped out of this session (if yes return false)
    //  If not, return true
    // If the user has no active recurring enrollment for this class time, return false

    console.log('\n\n' + '-'.repeat(25) + 'enrolled?' + '-'.repeat(25));
    console.log('enrolled? - IS USER ENROLLED IN SESSION?', sessionName);
    console.log('enrolled? - CLASS TIME:', classTime);
    console.log('enrolled? - classTime.start_date:', classTime.start_date);
    console.log('enrolled? - sessionDateTime:', sessionDateTime);
    console.log('enrolled? - SESSION NUM:', session_num);

    for (let individualEnroll of classTime.individual_enrolls) {
        if (individualEnroll.session_num === session_num) {
            console.log('enrolled? - YES, USER IS ENROLLED IN THIS SESSION (INDIVIDUAL ENROLLMENT)');
            // The user is enrolled in this session
            return true;
        }
    }
    for (let recurringEnroll of classTime.recurring_enrolls) {
        console.log('\nenrolled? - Loop iteration RECURRING ENROLL:', recurringEnroll);
        let startDateTime = new Date(Date.parse(classTime.start_date));
        startDateTime.setHours(...classTime.time.split(':'));

        console.log('enrolled? - startDateTime:', startDateTime);
        console.log('enrolled? - sessionDateTime:', sessionDateTime);

        if (startDateTime > sessionDateTime) {
            // session takes place before the class time starts, so the user is not enrolled
            // this shouldn't happen but treat this case as if the user is not enrolled in THIS recurringEnroll
            // (there may be other recurringEnrolls that the user is enrolled in, so continue the loop)
            console.error('Session takes place before the class time starts, this should never happen ' +
                'since session_num = 0 should be equal to class time starts.');
            continue;
        }

        console.log('enrolled? - recurringEnroll.end_datetime:', recurringEnroll.end_datetime);
        if (recurringEnroll.end_datetime !== null) {
            console.log('enrolled? - RECURRING ENROLL END DATETIME IS NOT NULL');
            console.log('enrolled? - recurringEnroll.end_datetime:', recurringEnroll.end_datetime);
            let endDateTime = new Date(recurringEnroll.end_datetime);
            console.log('enrolled? - endDateTime:', endDateTime);

            if (endDateTime < sessionDateTime) {
                console.log('enrolled? - END DATETIME IS BEFORE SESSION DATETIME');
                // session takes place after the recurring enrollment ends, so the user is not enrolled
                // in THIS recurringEnroll (but they may be enrolled in another recurringEnroll, so continue)
                continue;
            }

            // If we reach this point, the session takes place during the recurring enrollment period
            // and there IS an end date for the recurring enrollment (meaning that this probably happened
            // in the past)
        }

        // If we reach this point, the session takes place during the active recurring enrollment period
        // which is EITHER:
        // 1) end_datetime is null and sessionDateTime > startDateTime (could be past or future session), or
        // 2) startDateTime < sessionDateTime < endDateTime, meaning this must be past session

        // Check if the user has dropped out of this specific session
        let hasDropped = false;
        for (let drop of recurringEnroll.recurring_enroll_specific_session_drops) {
            console.log('enrolled? - Loop iteration DROP:', drop);
            if (drop.session_num === session_num) {
                console.log('enrolled? - NO, USER HAS DROPPED OUT OF THIS SESSION');
                // The user has dropped this session, so they are not enrolled in THIS recurringEnroll
                // (but they may be enrolled in another recurringEnroll, so continue)
                // ACTUALLY: they shouldn't be enrolled in another recurringEnroll, but we'll check just in case
                hasDropped = true;
            }
        }
        if (hasDropped) {
            continue;
        }

        // If we reach this point, the user is enrolled in this session
        console.log('enrolled? - YES, USER IS ENROLLED IN THIS SESSION (RECURRING ENROLLMENT)');
        return true;
    }

    // If we reach this point, the user is not enrolled in this session
    console.log('enrolled? - NO, USER IS NOT ENROLLED IN THIS SESSION');
    return false;
};

export default isUserEnrolledInSession;