import './styles.css';

import {useState, useEffect} from "react";

import CreditCardIcon from '@mui/icons-material/CreditCard';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import handleJsonResponseStatus from "../helpers/handleJsonResponseStatus";
import {useNavigate} from "react-router-dom";

const PaymentItem = ({paymentInfo}) => {
    const navigate = useNavigate();

    const [subInfo, setSubInfo] = useState({});
    
    useEffect(() => {
        getSubInfo(paymentInfo.subscription)
    }, [paymentInfo])

    const getSubInfo = (subID) => {
        console.log("Sub ID:");
        console.log(subID);
        if (subID === undefined || subID === "") {
            return;
        }
        fetch(`http://localhost:8000/accounts/subscriptions/${subID}/`, {
            method: 'GET',
        })
        .then((response) => {
            // if (response.status >= 400) {
            //     console.error("Error: Made connection but something wrong. Response: ", response);
            // } else {
            //     return response.json();
            // }
            return handleJsonResponseStatus(response, navigate);
        })
        .then((json) => {
            setSubInfo(json);
        })
        // console.log("SUB INFO (in item) ", subInfo);
    }

    return (
        <div className="m-2">
            <div className="paymentCard row p-2 border border-dark border-1">
                <div className="col-3 paymentCardEntry border-end">
                    {new Date(Date.parse(paymentInfo.datetime)).toLocaleString('en-us', { year: "numeric", month: "short", day: "2-digit" })}
                    <br/>
                    {new Date(Date.parse(paymentInfo.datetime)).toLocaleTimeString("en-US")}
                </div>
                <div className="col-4 paymentCardEntry border-end">
                    {subInfo.name}
                </div>
                <div className="col-2 paymentCardEntry border-end">
                    <AttachMoneyIcon className='me-2'/>
                    {paymentInfo.amount}
                </div>
                <div className="col-3 paymentCardEntry border-end">
                    <CreditCardIcon className='me-2'/> 
                    {paymentInfo.creditCardNumber}
                </div>
            </div>
        </div>
    )
}

export default PaymentItem;