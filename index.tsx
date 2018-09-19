import { IAugmentedJQuery, IComponentOptions, IRootScopeService } from 'angular'
import fromPairs = require('lodash.frompairs')
import isFunction = require('lodash.isfunction')
import NgComponent from 'ngcomponent'
import * as React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'

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
export function react2angular<Props>(
  Class: React.ComponentClass<Props> | React.SFC<Props>,
  bindingNames: (keyof Props)[] | null = null,
  injectNames: string[] = []
): IComponentOptions {
  const names = bindingNames
    || (Class.propTypes && Object.keys(Class.propTypes) as (keyof Props)[])
    || []

  return {
    bindings: fromPairs(names.map(_ => [_, '<'])),
    controller: ['$element', '$scope', ...injectNames, class extends NgComponent<Props> {
      static get $$ngIsClass() {
        return true
      }
      injectedProps: { [name: string]: any }
      constructor(private $element: IAugmentedJQuery, $scope: IRootScopeService, ...injectedProps: any[]) {
        super()
        this.injectedProps = {
          $scope
        }

        injectNames.forEach((name, i) => {
          this.injectedProps[name] = injectedProps[i]
        })
      }
      render() {
        const props = wrapIfFunction(this.injectedProps.$scope, this.props)
        render(<Class {...props} {...this.injectedProps} />, this.$element[0])
      }
      componentWillUnmount() {
        unmountComponentAtNode(this.$element[0])
      }
    }]
  }
}

function wrapIfFunction ($scope: IRootScopeService, props: object) : object {
  return Object.entries(props)
    .reduce((wrappedProps : object, [name, prop]) => {
      return {
        ...wrappedProps,
        [name] :  isFunction(prop) ? (...args: any[]) => {
          prop(...args)
          $scope.$applyAsync()
        } : prop
      }
    }, {})
}
