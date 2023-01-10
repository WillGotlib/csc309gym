import logo from "../../assets/tfc.png"

const Home = () => {
    return (
        <div className="HomeContent">
            <div className="text-center col-8 mx-auto">
                <h1>Toronto Fitness Club</h1>
                <p>Welcome to TFC!</p>
                <p>
                    Create an account or log in to start exploring the world's premiere network of fitness.
                    In the 50 years since our inception we have enstated locations all across the globe.
                </p>
            <img src={logo} className="rounded mx-auto mb-2 d-block" height="200em" alt="TFC"/>
                <p>    
                    We run our business with an iron fist. You should be so lucky to get into one of our classes.
                </p>

            </div>

        </div>
    )
}

export default Home;