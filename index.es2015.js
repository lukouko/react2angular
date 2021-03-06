"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fromPairs = require("lodash.frompairs");
const isFunction = require("lodash.isfunction");
const ngcomponent_1 = require("ngcomponent");
const React = require("react");
const react_dom_1 = require("react-dom");
/**
 * Wraps a React component in Angular. Returns a new Angular component.
 *
 * Usage:
 *
 *   ```ts
 *   type Props = { foo: number }
 *   class ReactComponent extends React.Component<Props, S> {}
 *   const AngularComponent = react2angular(ReactComponent, ['foo'])
 *   ```
 */
function react2angular(Class, bindingNames = null, injectNames = []) {
    const names = bindingNames
        || (Class.propTypes && Object.keys(Class.propTypes))
        || [];
    return {
        bindings: fromPairs(names.map(_ => [_, '<'])),
        controller: ['$element', '$scope', ...injectNames, class extends ngcomponent_1.default {
                constructor($element, $scope, ...injectedProps) {
                    super();
                    this.$element = $element;
                    this.injectedProps = {
                        $scope
                    };
                    injectNames.forEach((name, i) => {
                        this.injectedProps[name] = injectedProps[i];
                    });
                }
                static get $$ngIsClass() {
                    return true;
                }
                render() {
                    const props = wrapIfFunction(this.injectedProps.$scope, this.props);
                    react_dom_1.render(React.createElement(Class, Object.assign({}, props, this.injectedProps)), this.$element[0]);
                }
                componentWillUnmount() {
                    react_dom_1.unmountComponentAtNode(this.$element[0]);
                }
            }]
    };
}
exports.react2angular = react2angular;
function wrapIfFunction($scope, props) {
    return Object.entries(props)
        .reduce((wrappedProps, [name, prop]) => {
        return Object.assign({}, wrappedProps, { [name]: isFunction(prop) ? (...args) => {
                prop(...args);
                $scope.$applyAsync();
            } : prop });
    }, {});
}
//# sourceMappingURL=index.js.map