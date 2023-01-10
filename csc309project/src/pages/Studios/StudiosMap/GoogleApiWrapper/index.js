import React from 'react';
import { Map, GoogleApiWrapper, Marker } from 'google-maps-react';

const MapContainer = ({ google, userCoords, studiosCoords, width, padding, key }) => {
    return (
        <div>
            {/*<p>Width = {width} - ({padding} * 2) = {width - (padding * 2)}</p>*/}
            <Map
                key={key}
                google={google}
                zoom={8}
                initialCenter={{ lat: userCoords.lat, lng: userCoords.lng }}
                style={{ width: (width - (padding * 2)), height: '77em' }}
            >
                {studiosCoords.map(coord => (
                    <Marker
                        title={coord.name}
                        // key={coord.lat + coord.lng}
                        position={{ lat: coord.lat, lng: coord.lng }}
                    />
                ))}
            </Map>
        </div>

    );
};

export default GoogleApiWrapper({
    apiKey: 'AIzaSyA6SyrKJ_U8ekwO-XNp7WqICwmc_kod81A', // TODO: remove?
    language: 'English'
})(MapContainer);
