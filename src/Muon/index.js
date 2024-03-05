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
function createDom(fiber) {
    const dom = fiber.type === "TEXT_ELEMENT" ? document.createTextNode(fiber.props.nodeValue) : document.createElement(fiber.type);

    const isProperty = key => key !== "children"
    Object.keys(fiber.props)
        .filter(isProperty)
        .forEach(name => {
            dom[name] = fiber.props[name]
        })

    return dom
}

function render(element, container) {
    //TODO: implement render
    nextUnitOfWork = {
        dom: container,
        props: {
            children: [element]
        }
    }
}
let nextUnitOfWork = null

function workLoop(deadline) {
    let shouldYield = false
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        )
        shouldYield = deadline.timeRemaining() < 1
    }
    requestIdleCallback(workLoop)
}
requestIdleCallback(workLoop)

function performUnitOfWork(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber)
    }
    if (fiber.parent) {
        fiber.parent.dom.appendChild(fiber.dom)
    }

    const elements = fiber.props.children;
    let index = 0;
    let prevSibling = null;
    while (index < elements.length) {
        const element = elements[index];
        const newFiber = {
            type: element.type,
            props: element.props,
            parent: fiber,
            dom: null,
        }
        if (index === 0) {
            fiber.child = newFiber
        } else {
            prevSibling.sibling = newFiber
        }
        prevSibling = newFiber
        index++
    }

    if (fiber.child) {
        return fiber.child
    }
    let newFiber = fiber
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }
}
const fiber = (
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

render(fiber, document.getElementById('root'))
console.log(fiber)