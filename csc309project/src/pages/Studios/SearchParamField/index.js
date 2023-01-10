


const SearchParamField = ({displayName, paramName, paramValue, onParamChange}) => {
    return (
        <div>
            <label htmlFor={paramName} style={{
                fontSize: 24,
                marginTop: 8
            }}>{displayName}:</label>
            <br></br>
            <input
                type="text"
                style={{
                    height: 35,
                    fontSize: 22,
                }}
                id={paramName}
                placeholder='Enter a value'
                value={paramValue}
                onChange={event => onParamChange(paramName, event.target.value)}
            />
        </div>
    )
}

export default SearchParamField;