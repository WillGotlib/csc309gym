import {Link} from "react-router-dom";
import "./index.css";

const StudioCard = ({ studio }) => {
    // Return a card for this studio. Sample studio object:
    //  {"id": 3,
    //  "name":
    //  "Small Studio",
    //  "lng": "-1.000000",
    //  "lat": "1.000000",
    //  "address": "An Alleyway",
    //  "postal_code": "20500",
    //  "phone": "416-909-1298",
    //  "amenities": [],
    //  "images": []}

    // TODO: When this card is clicked, it should redirect to the studio details page for this studio.
    //  Hint: Use the <Link> component from react-router-dom to do this.
    // Question: How do we pass information to the studio details page?
    //  Answer: We can use the <Link> component's "to" prop to pass information
    // Question: Is using Link still a single page app?
    //  Answer: Yes, it is. The only difference is that the page is not reloaded.

    // TODO: Should we make more stuff required in backend? Or not show 'Address' if it's not available?
    //  Maybe we should dynamically show/hide the address, phone, etc. based on what's available.
    //  How do we do that? Maybe we can use the && operator to conditionally render things.
    //  See https://reactjs.org/docs/conditional-rendering.html#inline-if-with-logical--operator
    // TODO: Implemented below. Discuss whether we should do this. Amenities too? Write 'None' instead?

    // TODO: this instead?
    {/*{studio.address && <p className="studio-card-text">Address: {studio.address}</p>}*/}
    {/*{studio.postal_code && <p className="studio-card-text">Postal Code: {studio.postal_code}</p>}*/}
    {/*{studio.phone && <p className="studio-card-text">Phone: {studio.phone}</p>}*/}

    // Each card should contain the name, address, postal code, phone, and a list of amenities.
    return (
        <Link to={`/studios/${studio.id}`} style={{textDecoration: "none"}}>
            <div className="studio-card">
                <div className="studio-card-body">
                    {studio.name && <h5 className="studio-card-title">{studio.name}</h5>}
                    <p className="studio-card-text">Address: {studio.address}</p>
                    <p className="studio-card-text">Postal Code: {studio.postal_code}</p>
                    <p className="studio-card-text">Phone Number: {studio.phone}</p>
                    <div>
                        Amenities:
                        {studio.amenities.length === 0 ?
                            ' None' :
                            <ul className="studio-card-text">
                                {studio.amenities.map((amenity) => (
                                    <li>{amenity.type} ({amenity.quantity})</li>
                                ))}
                            </ul>
                        }
                    </div>
                    <div>
                        Coaches:
                        {studio.coaches.length === 0 ?
                            ' None' :
                            <ul className="studio-card-text">
                                {studio.coaches.map((coach) => (
                                    <li>{coach}</li>
                                ))}
                            </ul>
                        }
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default StudioCard;
