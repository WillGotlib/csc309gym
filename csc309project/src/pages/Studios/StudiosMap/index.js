import GoogleApiWrapper from "./GoogleApiWrapper";

const StudiosMap = ({userCoords, studiosCoords, width, padding, key}) => {
    return (
        <GoogleApiWrapper userCoords={userCoords} studiosCoords={studiosCoords}
                          width={width} padding={padding} key={key}/>
    )
}

export default StudiosMap;