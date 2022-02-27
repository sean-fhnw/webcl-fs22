// requires ./observable.js


const Computed = (computeValue, ...inputs) => {
    const computeValueBound = () => computeValue(...inputs.map(input=>input.getValue()));
    const value = Observable(computeValueBound());
    const update = () => value.setValue(computeValueBound());
    inputs.forEach(input=>input.onChange(update));

    return {
        getValue: value.getValue,
        onChange: value.onChange,
    }
};