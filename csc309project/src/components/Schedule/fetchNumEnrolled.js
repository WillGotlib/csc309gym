import wrappedConsoleLog from "../helpers/wrappedConsoleLog";

const fetchNumEnrolled = async (classTimeId, session_num) => {
    const url = `http://localhost:8000/studios/class_time/num_enrolled/${classTimeId}/${session_num}/`;
    wrappedConsoleLog('FETCHING NUM ENROLLED (in fetchNumEnrolled). URL:', url);
    const num_enrolled = await fetch(url, {
        method: 'GET',
        credentials: "same-origin",
        headers: {"Authorization": `Bearer ${localStorage.getItem('csrfAccess')}`},
    }).then(response => {
        if (response.ok) {
            return response.json()
        } else {
            throw new Error('Something went wrong fetching number of enrolled students!');
        }
    }).then(json => {
        let num_enrolled = json.num_enrolled;
        console.log('FETCHED Successfully, NUM ENROLLED:', num_enrolled);
        return num_enrolled;
    }).catch(error => {
        console.error('Error fetching number of enrolled students', error);
        return null;
    });
    console.log('-'.repeat(50) + '\n\n');
    return num_enrolled;
};

export default fetchNumEnrolled;