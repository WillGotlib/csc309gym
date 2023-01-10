import StudioCard from "./StudioCard";

const StudiosList = ({studiosList}) => {
    const border = '4px solid black';
    if (studiosList.results.length > 0) {
        return (
            <div style={{border: border}}>
                {studiosList.results.map((studio) => (
                    <StudioCard key={studio.id} studio={studio}/>
                ))}
            </div>
        )
    } else {
        return (
            <div style={{border: border}}>
                <h4 style={{margin: 10}}>No matching studios found. <br/> Try some other filters!</h4>
            </div>
        )
    }
}

export default StudiosList;