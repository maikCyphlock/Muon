
/**
 * Create a new element with the given type, props, and children.
 *
 * @param {type} type - The type of the element.
 * @param {type} props - The properties of the element.
 * @param {...type} children - The children elements of the element.
 * @return {object} The newly created element.
 */
function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child => typeof child === 'object' ? child : createTextElement(child)),
        },
    }
}

/**
 * Creates a text element with the given text.
 *
 * @param {string} text - the text for the text element
 * @return {object} the created text element
 */
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
 * Creates a DOM element based on the given fiber object.
 *
 * @param {Object} fiber - The fiber object used to create the DOM element.
 * @return {Element} The created DOM element.
 */
function createDom(fiber) {
    const dom = fiber.type === "TEXT_ELEMENT" ? document.createTextNode(fiber.props.nodeValue) : document.createElement(fiber.type);

    updateDom(dom, {}, fiber.props)

    return dom
}
const isEvent = key => key.startsWith("on")
const isProperty = key =>
    key !== "children" && !isEvent(key)
const isNew = (prev, next) => key =>
    prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)
/**
 * Updates the DOM based on the changes in the previous and next properties.
 *
 * @param {Object} dom - the DOM element to be updated
 * @param {Object} prevProps - the previous properties of the DOM element
 * @param {Object} nextProps - the next properties of the DOM element
 */
function updateDom(dom, prevProps, nextProps) {
    //Remove old or changed event listeners
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(
            key =>
                !(key in nextProps) ||
                isNew(prevProps, nextProps)(key)
        ).forEach(name => {
            const eventType = name
                .toLowerCase()
                .substring(2)
            dom.removeEventListener(
                eventType,
                prevProps[name]
            )
        })

    // Remove old properties
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(prevProps, nextProps))
        .forEach(name => dom[name] = '')
    // Set new or changed properties
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps)).forEach(name => {
            dom[name] = nextProps[name]
        })

    // Add event listeners
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            const eventType = name
                .toLowerCase()
                .substring(2)
            dom.addEventListener(
                eventType,
                nextProps[name]
            )
        })
}
/**
 * Commits the root by processing deletions, committing work, and updating root and progressRoot.
 *
 */
function commitRoot() {
    deletions.forEach(commitWork)
    commitWork(progressRoot.child)
    currentRoot = progressRoot
    progressRoot = null
}

/**
 * Commits the changes made during the reconciliation to the actual DOM.
 *
 * @param {object} fiber - The fiber node representing the current work
 * @return {void} 
 */
function commitWork(fiber) {
    if (!fiber) {
        return
    }

    let domParentFiber = fiber.parent
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.parent
    }
    const domParent = domParentFiber.dom

    if (
        fiber.effectTag === "PLACEMENT" &&
        fiber.dom != null
    ) {
        domParent.appendChild(fiber.dom)
    } else if (
        fiber.effectTag === "UPDATE" &&
        fiber.dom != null
    ) {
        updateDom(
            fiber.dom,
            fiber.alternate.props,
            fiber.props
        )
    } else if (fiber.effectTag === "DELETION") {
        commitDeletion(fiber, domParent)
    }

    commitWork(fiber.child)
    commitWork(fiber.sibling)
}

/**
 * Commit deletion of a fiber node from the DOM parent.
 *
 * @param {object} fiber - the fiber node to be deleted
 * @param {object} domParent - the DOM parent from which the fiber node will be deleted
 * @return {void} 
 */
function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom)
    } else {
        commitDeletion(fiber.child, domParent)
    }
}
/**
 * Render the given element into the specified container.
 *
 * @param {element} element - the element to render
 * @param {container} container - the container to render the element into
 */
function render(element, container) {

    progressRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot,

    }
    deletions = [];
    nextUnitOfWork = progressRoot
}
let nextUnitOfWork = null
let progressRoot = null
let currentRoot = null
let deletions = null
/**
 * A function that runs a work loop until a specific deadline is reached.
 *
 * @param {Object} deadline - The deadline object to check if the loop should yield
 * @return {void} 
 */
function workLoop(deadline) {
    let shouldYield = false
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(
            nextUnitOfWork
        )
        shouldYield = deadline.timeRemaining() < 1
    }
    if (!nextUnitOfWork && progressRoot) {
        commitRoot()
    }
    requestIdleCallback(workLoop)
}
requestIdleCallback(workLoop)

/**
 * Perform a unit of work in the fiber tree.
 *
 * @param {Object} fiber - The fiber to perform work on
 * @return {Object} The next fiber to perform work on
 */
function performUnitOfWork(fiber) {
    const isFunctionComponent =
        fiber.type instanceof Function
    if (isFunctionComponent) {
        updateFunctionComponent(fiber)
    } else {
        updateHostComponent(fiber)
    }
    if (fiber.child) {
        return fiber.child
    }
    let nextFiber = fiber
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }
}

let wipFiber = null
let hookIndex = null
/**
 * Update a function component in the fiber.
 *
 * @param {Object} fiber - The fiber to be updated
 * @return {void} 
 */
function updateFunctionComponent(fiber) {
    wipFiber = fiber
    hookIndex = 0
    wipFiber.hooks = []
    const children = [fiber.type(fiber.props)]
    reconcileChildren(fiber, children)
}
/**
 * Custom implementation of useState hook
 * @param {any} initial - Initial state value
 * @returns {[any, function]} - Array containing state value and setter function
 */
function useState(initial) {
    const oldHook =
        wipFiber.alternate &&
        wipFiber.alternate.hooks &&
        wipFiber.alternate.hooks[hookIndex]

    const hook = {
        state: oldHook ? oldHook.state : initial,
        queue: []
    }
    const actions = oldHook ? oldHook.queue : []
    actions.forEach(action => {
        hook.state = action(hook.state)
    })
    const setState = action => {

        hook.queue.push(action)
        progressRoot = {
            dom: currentRoot.dom,
            props: currentRoot.props,
            alternate: currentRoot
        }
        nextUnitOfWork = progressRoot
        deletions = []
    }
    wipFiber.hooks.push(hook)
    hookIndex++
    return [hook.state, setState]
}

/**
 * Update the host component based on the given fiber.
 *
 * @param {Object} fiber - The fiber to be updated
 * @return {void} 
 */
function updateHostComponent(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber)
    }
    reconcileChildren(fiber, fiber.props.children)
}
/**
 * Reconciles children elements in the fiber tree.
 *
 * @param {Object} progressFiber - The current fiber being processed.
 * @param {Array} elements - The elements to reconcile with the progressFiber.
 */
function reconcileChildren(progressFiber, elements) {
    let index = 0;
    let oldFiber = progressFiber.alternate && progressFiber.alternate.child;
    let prevSibling = null

    while (index < elements.length || oldFiber != null) {
        const element = elements[index]
        let newFiber = null


        const sameType = oldFiber && element && element.type === oldFiber.type

        if (sameType) {
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                parent: progressFiber,
                alternate: oldFiber,
                effectTag: "UPDATE",
            }
        }
        if (element && !sameType) {
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                parent: progressFiber,
                alternate: null,
                effectTag: "PLACEMENT",
            }
        }
        if (oldFiber && !sameType) {
            oldFiber.effectTag = "DELETION"
            deletions.push(oldFiber)
        }
        if (oldFiber) {
            oldFiber = oldFiber.sibling
        }

        if (index === 0) {
            progressFiber.child = newFiber
        } else if (element) {
            prevSibling.sibling = newFiber
        }

        prevSibling = newFiber
        index++
    }
}

const Muon = {
    createElement,
    render,
    useState,
}



/** @jsx Muon.createElement */
function Counter() {
    const [state, setState] = Muon.useState(1)
    const handlerClick = () => setState(c => c + 1)
    return (

        <div>
            <button onClick={handlerClick}>
                Count: {state}
            </button>
            <div onClick={() => setState(c => c - 1)}>decrement</div>
        </div>


    )
}
const element = <Counter />
const container = document.getElementById("root")
Muon.render(element, container)