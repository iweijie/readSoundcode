import verifyPlainObject from '../utils/verifyPlainObject'

export function wrapMapToPropsConstant(getConstant) {
  return function initConstantSelector(dispatch, options) {
    const constant = getConstant(dispatch, options)

    function constantSelector() {
      return constant
    }
    constantSelector.dependsOnOwnProps = false
    return constantSelector
  }
}

// dependsOnOwnProps is used by createMapToPropsProxy to determine whether to pass props as args
// to the mapToProps function being wrapped. It is also used by makePurePropsSelector to determine
// whether mapToProps needs to be invoked when props have changed.
//
// A length of one signals that mapToProps does not depend on props from the parent component.
// A length of zero is assumed to mean mapToProps is getting args via arguments or ...args and
// therefore not reporting its length accurately..

// 在 传入 dependsOnOwnProps 属性的情况下，转为 Boolean值
// 在 未传入的情况下 ； 取函数的参数长度 
export function getDependsOnOwnProps(mapToProps) {
  return mapToProps.dependsOnOwnProps !== null &&
    mapToProps.dependsOnOwnProps !== undefined
    ? Boolean(mapToProps.dependsOnOwnProps)
    : mapToProps.length !== 1
}

// Used by whenMapStateToPropsIsFunction and whenMapDispatchToPropsIsFunction,
// this function wraps mapToProps in a proxy function which does several things:
//
//  * Detects whether the mapToProps function being called depends on props, which
//    is used by selectorFactory to decide if it should reinvoke on props changes.
//
//  * On first call, handles mapToProps if returns another function, and treats that
//    new function as the true mapToProps for subsequent calls.
//
//  * On first call, verifies the first result is a plain object, in order to warn
//    the developer that their mapToProps function is not returning a valid result.
//
export function wrapMapToPropsFunc(mapToProps, methodName) {
  return function initProxySelector(dispatch, { displayName }) {
    const proxy = function mapToPropsProxy(stateOrDispatch, ownProps) {
      // 首次进入 proxy.dependsOnOwnProps 为 true ；
      return proxy.dependsOnOwnProps
        ? proxy.mapToProps(stateOrDispatch, ownProps)
        : proxy.mapToProps(stateOrDispatch)
    }

    // allow detectFactoryAndVerify to get ownProps
    proxy.dependsOnOwnProps = true

    proxy.mapToProps = function detectFactoryAndVerify(
      stateOrDispatch,
      ownProps
    ) {
      // 更新 proxy.mapToProps 的值
      //  mapToProps 为为用connect() 的第一个参数
      proxy.mapToProps = mapToProps
      //  mapToProps.dependsOnOwnProps 属性可以更新 proxy.dependsOnOwnProps 的值
      // 当前值用于 标识 是否传入 ownProps 参数
      proxy.dependsOnOwnProps = getDependsOnOwnProps(mapToProps)

      // 再次调用 用于 调用 传入的 mapStateToProps 函数；获取返回值；
      let props = proxy(stateOrDispatch, ownProps)
      // 如返回的 props 为函数；则递归调用
      if (typeof props === 'function') {
        proxy.mapToProps = props
        proxy.dependsOnOwnProps = getDependsOnOwnProps(props)
        props = proxy(stateOrDispatch, ownProps)
      }

      return props
    }

    return proxy
  }
}
