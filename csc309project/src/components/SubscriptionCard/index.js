import './styles.css';


const SubscriptionCard = (props) => {
    var info = props.sub

    return (
        <div className="subCard p-2 border border-dark border-4 rounded-3">
            <span><h3><span className='subID'>{info.id}</span>: <span className='subName'>{info.name}</span></h3></span>
            ${info.fee} per {info.pay_period}<br/>

        </div>
    )
}

export default SubscriptionCard;