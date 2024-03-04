/** @jsx Muon.createElement */

const Muon = {
    createElement,
}
function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child => typeof child === 'object' ? child : createTextElement(child)),
        },
    }
}

function createTextElement(text) {
    return {
        type: 'TEXT_ELEMENT',
        props: {
            nodeValue: text,
            children: [],
        },
    }
}

/**
 *  @param {object} element
 *  @param {HTMLElement} container 
 */
function render(element, container) {


    const dom = element.type === "TEXT_ELEMENT" ? document.createTextNode(element.props.nodeValue) : document.createElement(element.type);

    const isProperty = key => key !== "children"
    Object.keys(element.props)
        .filter(isProperty)
        .forEach(name => {
            dom[name] = element.props[name]
        })


    element.props.children.forEach(child =>
        render(child, dom)
    )
    container.appendChild(dom);


}

const element = (
    <div id="foo">
        <a>bar</a>
        <b />
        <h1>hellow</h1>
        <div>
            <h2>hola </h2>
        </div>
        <a>baz</a>
    </div>
)

render(element, document.getElementById('root'))
console.log(element)