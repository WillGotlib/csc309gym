import {Link, useNavigate} from "react-router-dom";
import React, {useEffect, useState} from "react";
import moment from "moment";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import handleJsonResponseStatus from "../../helpers/handleJsonResponseStatus";
import './index.css';

function SessionCard({session, showPastNumEnrolled}) {
    const navigate = useNavigate();
    // Each session has:
    // name, capacity, description, coach, sessionNum, time, duration, id, past (whether in past), and num_enrolled

    // TODO: What to do with class time ID? How store so that we can get it for enroll?
    // TODO: Add Modal cases for enrolled vs open vs full vs past]

    const available = session.num_enrolled < session.capacity
    const availabilityMsg = available ? "Available" : "Full";
    const time12Hour = moment(session.time, "HH:mm:ss").format("h:mm A");
    // const pastMsg = session.past ? "Yes" : "No";
    // const isEnrolledMsg = session.is_enrolled ? "Yes" : "No";

    const [confirmShow, setConfirmShow] = useState(false);
    const [feedbackShow, setFeedbackShow] = useState(false);
    const [feedback, setFeedback] = useState(<></>);

    let color = 'lightBlue'
    if (session.past) {
        color = 'lightGrey';
    } else if (session.is_enrolled) { // TODO: && session.num_enrolled > 0
        // console.log('IS ENROLLED, ', session);
        // If in future and is enrolled, then show green
        color = 'lightGreen';
    }

    const handleCloseConfirmation = () => {
        setConfirmShow(false)
        setFeedbackShow(false);
        setFeedback("");
    }

    const handleShowConfirmation = () => setConfirmShow(true);

    const enrollmentDialogue = (session) => {
        if (session !== null) {
            handleShowConfirmation();
        } else {
            console.error("Fella you clickin in the wrong places")
        }
    }

    const handleEnroll = (recurring) => {
        if (localStorage.getItem('csrfAccess') === "") { // We're NOT LOGGED IN.
            setFeedback("Log in before making enrollment adjustments.");
        }

        console.log("Session (Enroll)", session);
        console.log("Recurring", recurring);
        const formData = new FormData();
        if (!recurring) {
            console.log("Individual enroll");
            formData.append('session_num', session.sessionNum);
        }
        var res_status = 400;
        console.log("Form data for enrollment:", formData.entries()[0]);
        fetch(`http://localhost:8000/studios/class_time/${session.id}/enroll/`, {
            method: 'POST',
            credentials: "same-origin",
            headers: {"Authorization" : `Bearer ${localStorage.getItem('csrfAccess')}`},
            body: formData,
        })
        .then((response) => {
            res_status = response.status;
            if (response.status >= 400 && response.status !== 403) {
                console.log("Something went wrong:")
                // throw "Error code: " + response.status;
            }
            console.log(response.status)
            return handleJsonResponseStatus(response, navigate);
        })
        .then((data) => {
            console.log(data)
            setFeedback(data.message)
            if (res_status < 400) { 
                session.num_enrolled++;
                session.is_enrolled = true; 
            } // This makes it turn green immediately.
        })
        .catch((error) => {
            console.error(error)
        });

        setFeedbackShow(true);
    }

    const handleDrop = (recurring) => {
        if (localStorage.getItem('csrfAccess') === "") { // We're NOT LOGGED IN.
            setFeedback("Log in before making enrollment adjustments.");
        }

        console.log("Session (Drop)", session);
        console.log("Recurring", recurring);
        const formData = new FormData();
        if (recurring === false) {
            console.log("Doing a individual drop.");
            formData.append('session_num', session.sessionNum);
        }
        var res_status = 400;
        console.log("Form data for enrollment:", formData);
        fetch(`http://localhost:8000/studios/class_time/${session.id}/drop/`, {
            method: 'POST',
            credentials: "same-origin",
            headers: {"Authorization" : `Bearer ${localStorage.getItem('csrfAccess')}`},
            body: formData,
        })
        .then((response) => {
            res_status = response.status;
            if (response.status >= 400 && response.status !== 403) {
                console.log("Something went wrong:")
                // throw "Error code: " + response.status;
            }
            console.log(response.status)
            return handleJsonResponseStatus(response, navigate);
        })
        .then((data) => {
            console.log(data)
            setFeedback(data.message)
            if (res_status < 400) { 
                session.num_enrolled--;
                session.is_enrolled = false; 
            } // This makes it turn green immediately.
        })
        .catch((error) => {
            console.error(error)
        });

        setFeedbackShow(true);
    }

    
    const handleRecurringEnroll = () => {
        console.log("Enroll Recurring");
        handleEnroll(true);
    }
    const handleIndividualEnroll = () => {
        console.log("Enroll Individual");
        handleEnroll(false);
    }
    
    const handleRecurringDrop = () => {
        console.log("Drop Recurring");
        handleDrop(true);
    }
    const handleIndividualDrop = () => {
        console.log("Drop Individual");
        handleDrop(false);
    }
    

    return (
        <>
        <Link style={{textDecoration: 'none'}}>
            <div className="session-card" style={{backgroundColor: color}}
                onClick={() => { enrollmentDialogue(session) }} >
                <h4>{session.name}</h4>
                <p>{time12Hour}, {session.duration} hours</p>

                <div className={'session-details'} style={{fontSize: 13}}>
                    <div className={'session-details-sec1'}>
                        <ul style={{listStyle: 'none', marginLeft: 10, padding: 0}}>
                            {/* <li>Studio: {session.studioName}</li> */}
                            {/* Show NumEnrolled if showPastNumEnrolled is true, and if showPastNumEnrolled
                                     is false, only show if session.past is false. */}
                            {(showPastNumEnrolled || (!showPastNumEnrolled && !session.past)) &&
                                <li>Enrolled: {session.num_enrolled}/{session.capacity} ({availabilityMsg})</li>}
                            <li>Session Number: {session.sessionNum}</li>
                        </ul>
                    </div>
                    <div className={'session-details-sec2'}>
                        <ul style={{listStyle: 'none', marginLeft: 10, padding: 0}}>
                            {session.coach && <li>Coach: {session.coach}</li>}
                            {session.description &&
                                <li>Description:
                                    <div style={{marginLeft: 10}}>
                                        {session.description}
                                    </div>
                                </li>}
                            {session.keywords &&
                                <li>Keywords:
                                    <div style={{marginLeft: 10}}>
                                        {session.keywords}
                                    </div>
                                </li>}
                        </ul>
                    </div>
                    <div className={'session-details-sec3'}>
                        <ul style={{listStyle: 'none', marginLeft: 10, padding: 0}}>
                            {session.is_enrolled &&  session.num_enrolled > 0 && <li>You {session.past ? 'were' : 'are'} enrolled in this session.</li>}
                            {session.past && <li>Session has passed.</li>}
                        </ul>
                    </div>
                </div>
            </div>
        </Link>

        <Modal show={confirmShow} onHide={handleCloseConfirmation}>
            <Modal.Body>
                <h3 className="text-center"><b>
                    {session.is_enrolled ? (<>Inspect/Drop</>) : (<>Enroll</>)}
                    </b></h3>
                <hr/>
                <div style={{fontSize: 20}}>
                    {session.past && (<p className="text-center">Session already happened.</p>)}
                    {<p className="text-center"> You
                        {session.past ? ' were ' : ' are '}
                        {session.is_enrolled ? '' : ' not '}
                        enrolled in this session.</p>}
                </div>

                {/* // Each session has:
                // duration, id, past (whether in past), and num_enrolled */}
                <div className="text-left">
                    <h4>{session.name}</h4>
                    <p>{session.day} {session.time} ({session.duration} hours), {' '} Session Number {session.sessionNum}</p>
                    <i>Description: {session.description}</i><br/>

                    <ul className='SessionCardModalInfo'
                        style={{listStyle: 'none', marginLeft: 10, marginTop: 10, padding: 0}}>
                        <li>Coach: {session.coach}</li>
                        {session.keywords &&
                            <li>Keywords:
                                <div style={{marginLeft: 10}}>
                                    <ul>
                                        {session.keywords.split(',').map((keyword) => (
                                            <li>{keyword}</li>
                                        ))}
                                    </ul>
                                </div>
                            </li>}
                        <hr/>
                        {!session.past &&
                            <b>Currently Enrolled: {session.num_enrolled}/{session.capacity} ({availabilityMsg})</b>}
                    </ul>

                    {feedbackShow && (
                        <>
                            <hr/>
                            {feedback}
                        </>
                    )}
                </div>
                
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseConfirmation}>
                    Close
                </Button>
                {(!session.past && available && !session.is_enrolled) && (
                <>
                    <Button variant="primary" onClick={handleRecurringEnroll}>
                        Enroll All Future Sessions (From Now)
                    </Button>
                    <Button variant="primary" onClick={handleIndividualEnroll}>
                        Enroll In This Session
                    </Button>
                </>
                )}
                {(!session.past && session.is_enrolled) && (
                <>
                    <Button variant="danger" onClick={handleRecurringDrop}>
                        Drop All Future Sessions (From Now)
                    </Button>
                    <Button variant="danger" onClick={handleIndividualDrop}>
                        Drop This Session
                    </Button>
                </>
                )}
            </Modal.Footer>
        </Modal>
        </>
    );
}

export default SessionCard;