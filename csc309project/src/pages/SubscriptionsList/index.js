import {useEffect, useState, useContext} from "react";

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import SubscriptionCard from "../../components/SubscriptionCard";
import CurrentSubscription from "../Profile/CurrentSubscription";
import UserContext from "../../contexts/userContext";
import handleJsonResponseStatus from "../../components/helpers/handleJsonResponseStatus";
import {useNavigate} from "react-router-dom";

const SubscriptionsList = () => {
    const navigate = useNavigate();

    const [params, setParams] = useState({page: 1});
    const [subs, setSubs] = useState({});
    const [selectedSub, setSelectedSub] = useState({});

    const [confirmShow, setConfirmShow] = useState(false);
    const [feedbackShow, setFeedbackShow] = useState(false);
    const [feedback, setFeedback] = useState(<></>);

    const {context, setContext} = useContext(UserContext);

    // Try calling studio ids so that we redirect to login if 403 (token expired or not logged in)
    // useEffect(() => {
    //     const tryFetch = () => {
    //         fetch('http://localhost:8000/studios/ids', {
    //             method: 'GET',
    //             credentials: "same-origin",
    //             headers: {"Authorization": `Bearer ${localStorage.getItem('csrfAccess')}`},
    //         }).then((response) => {
    //             console.log('OUTPUT?', handleJsonResponseStatus(response, navigate));
    //         });
    //     }
    //     tryFetch();
    // }, []);

    useEffect(() => {
        // TODO: Something isn't working here right now...now updating the database or something because when I
        // subscribe and then reload, it doesn't detect that I have a subscription anymore. Same for payments and stuff
        // setContext({...context, csrfAccess: localStorage.getItem('csrfAccess')})

        fetch(`http://localhost:8000/accounts/subscriptions/all/?page=${params.page}`, {
            method: 'GET',
        })
        .then((response) => handleJsonResponseStatus(response, navigate))
        .then((data) => {
            console.log(data)
            setSubs(data)
        })
        .catch((error) => {
            console.error(error)
        });
        
    }, [params, context])

    const handleCloseConfirmation = () => {
        setConfirmShow(false)
        setFeedbackShow(false);
        setFeedback("");
    }
    const handleShowConfirmation = () => setConfirmShow(true);

    const subscriptionDialogue = (subscription) => {
        console.log(subscription);
        if (subscription !== null) {
            setSelectedSub(subscription);
            handleShowConfirmation();
        } else {
            console.error("Fella you clickin in the wrong places")
        }
    }

    const handleSubscribe = (subscription) => {
        // Attempt to subscribe.
        console.log(context)
        console.log(selectedSub)
        if (localStorage.getItem('csrfAccess') === "") { // We're NOT LOGGED IN.
            setFeedback("Log in to make a subscription!");
        }
        var res_status = 400;

        console.log("About to attempt to subscribe.")
        fetch(`http://localhost:8000/accounts/subscriptions/${selectedSub.id}/subscribe/`, {
            method: 'POST',
            credentials: "same-origin",
            headers: {"Authorization" : `Bearer ${localStorage.getItem('csrfAccess')}`},
        })
        .then((response) => {
            res_status = response.status;

            return handleJsonResponseStatus(response, navigate);
        })
        .then((data) => {
            console.log(data)
            console.log(res_status)
            setFeedback(data.message)
            if (res_status < 400) {
                setContext({...context, activeSubscription: selectedSub.id});
                localStorage.setItem('activeSubscription', selectedSub.id);
            }
            console.log("Context Sub: ", context.activeSubscription);
        })
        .catch((error) => {
            console.error(error)
        });

        setFeedbackShow(true);
    }


    return (
        <>
            <h1 className="text-center">Subscriptions</h1>
            {localStorage.getItem('csrfAccess') !== "" && (
                <div style={{margin: 25}}>
                    <h2>Your Current Subscription:</h2>
                    <CurrentSubscription/>
                </div>

            )}
            
            <h2 style={{margin: 25}}>All Available Subscriptions</h2>
            
            <div className="row justify-content-center">
                {subs['results'] !== undefined && subs['results'].map((subscription) => {
                    return (<span className="col-5 ms-2 me-2 mb-4"
                                  onClick={() => {
                                      subscriptionDialogue(subscription)
                                  }}>
                          <SubscriptionCard sub={subscription}/>
                        </span>)
                })}
                <br/>
            </div>
            <nav aria-label="Page navigation example">
                <ul className="pagination justify-content-center">
                    <button className="page-item" onClick={() => {
                        if (subs['prev'] !== null) {
                            setParams({...params, page: Math.max(1, params.page - 1)})
                        }
                    }
                    }>
                        Previous
                    </button>
                    <button className="page-item"
                            style={{marginLeft: 10}}
                            onClick={() => {
                                    if (subs['next'] !== null && subs['next'] !== undefined) {
                                        setParams({...params, page: params.page + 1})
                                    }
                                }
                        //  TODO: What if results doesn't exist and stuff
                    }>
                        Next
                    </button>
                </ul>
            </nav>

            <Modal show={confirmShow} onHide={handleCloseConfirmation}>
                <Modal.Body>
                    Would you like to subscribe to this subscription? <br/>
                    <h4> {selectedSub.name}: ${selectedSub.fee}/{selectedSub.pay_period} </h4>
                    {localStorage.getItem('csrfAccess') === '' && (<div className="text-center">Log in to subscribe.</div>) }
                    {feedbackShow && (
                        <>
                            <hr/>
                            {feedback}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseConfirmation}>
                        Close
                    </Button>
                    {selectedSub.id !== localStorage.getItem('activeSubscription') && localStorage.getItem('csrfAccess') !== '' && (
                    <Button variant="primary" onClick={handleSubscribe}>
                        Subscribe
                    </Button>
                    )}
                </Modal.Footer>
            </Modal>
        </>
    )
}

export default SubscriptionsList;