import {useEffect, useState, useContext} from "react";

import UserContext from "../../contexts/userContext";
import SubscriptionContext from "../../contexts/subscriptionContext";
import PaymentItem from "../PaymentItem";
import handleJsonResponseStatus from "../helpers/handleJsonResponseStatus";
import {useNavigate} from "react-router-dom";

const PaymentList = (userInfo) => {
    const navigate = useNavigate();
    const [params, setParams] = useState({page: 1});
    const [payments, setPayments] = useState({});
    const [nextSubPayment, setNextSubPayment] = useState({});
    const [nextPayment, setNextPayment] = useState({});
    const [mostRecent, setMostRecent] = useState("");
    const [subInfo, setSubInfo] = useState({});

    const {context, setContext} = useContext(UserContext);
    const {subContext, setSubContext} = useContext(SubscriptionContext);

    useEffect(() => {
        console.log("User Info:" , userInfo.userInfo);
        retrieveHistory();
        if (context.activeSubscription !== null && context.activeSubscription !== "") {
            retrieveNextInfo();
        }
        console.log("CALLING ASSEMBLENEXTPAYMENT")
        assembleNextPayment();
    }, [params, mostRecent])

    const retrieveHistory = () => {
        // Fetch payment history from backend.
        fetch(`http://localhost:8000/accounts/payments/history?page=${params.page}`, {
            method: 'GET',
            credentials: "same-origin",
            headers: {"Authorization": `Bearer ${localStorage.getItem('csrfAccess')}`},
        })
        .then((response) => handleJsonResponseStatus(response, navigate))
        .then((data) => {
            // console.log("DATA", data);
            setPayments(data);
        })
        .then(() => console.log("STATE", payments))
        .catch((error) => {
            console.error(error);
        });
    }

    const assembleNextPayment = () => {
        if (userInfo.activeSubscription != "") {
            // Fetch payment history from backend.
            fetch(`http://localhost:8000/accounts/payments/history?page=1`, {
                method: 'GET',
                credentials: "same-origin",
                headers: {"Authorization": `Bearer ${localStorage.getItem('csrfAccess')}`},
            })
            .then((response) => handleJsonResponseStatus(response, navigate))
            .then((data) => {
                console.log("DATA2", data.results);
                if (data.results !== undefined) {
                    setMostRecent(data.results[0].datetime);
                }
            })
            .catch((error) => {
                console.error(error);
            });

            retrieveSubscription();
            console.log("Sub Info: ", subInfo)
            console.log("MOST RECENT DATE: ", mostRecent)
            var old_date = new Date(mostRecent);
            var new_date = new Date(old_date)
            if (subInfo.pay_period === 'DAY') {
                console.log("HIT 'DAY'");
                new_date = new Date(old_date.setDate(old_date.getDate()+1))
            } else if (subInfo.pay_period === 'WEEK') {
                console.log("HIT 'WEEK'");
                new_date = new Date(old_date.setDate(old_date.getDate()+7))
            } else if (subInfo.pay_period === 'MONTH') {
                new_date = new Date(old_date.setMonth(old_date.getMonth()+1));
            } else { //if (subInfo.pay_period === 'YEAR') {
                console.log("HIT 'YEAR'");
                new_date = new Date(old_date.setFullYear(old_date.getFullYear()+1))
            }
            console.log("NEW DATE:" , new_date)
            // TODO: Have to fix this. It's not working for some reason. Fix YEAR and DAY and add WEEK.

            // console.log("SUB INFO:", subInfo);
            var new_payment = { 'amount': subInfo.fee,
                                'creditCardNumber': userInfo.userInfo.creditCardNumber,
                                'datetime': new_date,
                                'id': 0,
                                'subscription': localStorage.getItem('activeSubscription'),
                                'user': userInfo.userInfo.id
                                }
            console.log("NEW PAYMENT:", new_payment);
            setNextPayment(new_payment);
        }
    }

    const retrieveSubscription = () => {
        if (localStorage.getItem('activeSubscription') === "") {
            return;
        }
        fetch(`http://localhost:8000/accounts/subscriptions/${localStorage.getItem('activeSubscription')}/`, {
            method: 'GET',
        })
        .then((response) => {
            // if (response.status >= 400) {
            //     console.error("Error: Made connection but something wrong");
            // } else {
            //     return response.json();
            // }
            return handleJsonResponseStatus(response, navigate);
        })
        .then((json) => {
            // console.log(json);
            setSubInfo(json);
        })
    }

    const retrieveNextInfo = () => {
        // Fetch next payment from backend.
        fetch("http://localhost:8000/accounts/payments/future", {
            method: 'GET',
            credentials: "same-origin",
            headers: {"Authorization": `Bearer ${localStorage.getItem('csrfAccess')}`},
        })
        .then((response) => {
            return handleJsonResponseStatus(response, navigate);
        })
        .then((data) => {
            console.log("retrieveNextInfo:", data);
            setNextSubPayment(data[0]);
        })
        // .then(() => console.log("STATE", payments))
        .catch((error) => {
            console.error(error);
        });
    }

    return (
        <>
            <h1 className="text-center">Payments</h1>
            <div style={{marginTop: 15}}>
                <h3>Next Payment</h3>
                {context.activeSubscription == "" || context.activeSubscription == null ||
                    !(userInfo.userInfo.creditCardNumber > 0) ? (
                    <div style={{margin: 20, fontSize: 20}}>
                        No payments scheduled.
                    </div>
                ) : (
                    <PaymentItem paymentInfo={nextPayment}/>
                )}
            </div>

            <div style={{marginTop: 25}}>
                <h3 className="mt-2" >Payment History</h3>
                <nav aria-label="Page navigation example">
                    <div className="pagination justify-content-left"
                         style={{margin:10, marginLeft: 5, fontSize: 20}}>
                        <button className="page-item"
                                style={{marginRight: 10}}
                                onClick={() => {
                                    if (payments['prev'] !== null) {
                                        setParams({...params, page: Math.max(1, params.page - 1)})
                                    }
                                }
                                }>
                            Newer Payments
                        </button>
                        <button className="page-item" onClick={() => {
                            if (payments['next'] !== null && payments['next'] !== undefined) {
                                setParams({...params, page: params.page + 1})
                            }
                        }
                            //  TODO: What if results doesn't exist and stuff
                        }>
                            Older Payments
                        </button>
                    </div>
                </nav>
                { payments.results != undefined &&
                    payments.results.map((payment) => {
                        // return payment.amount
                        // console.log("ABOUT TO USE: ", payment)
                        return <PaymentItem paymentInfo={payment}/>
                    })
                }
            </div>
        </>
    )
}

export default PaymentList;