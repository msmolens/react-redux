/*eslint-disable react/prop-types*/

import React from 'react'
import { createStore } from 'redux'
import { Provider as ProviderMock, connect } from '../../src/index.js'
import * as rtl from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

describe('React', () => {
  describe('connect', () => {
    afterEach(() => rtl.cleanup())

    it('should render on useEffect hook state update', () => {
      const store = createStore((state, action) => {
        let newState =
          state !== undefined
            ? state
            : {
                byId: {},
                list: [],
              }
        switch (action.type) {
          case 'FOO':
            newState = {
              ...newState,
              list: [1],
              byId: { 1: 'foo' },
            }
            break
        }
        return newState
      })

      const mapStateSpy1 = jest.fn()
      const renderSpy1 = jest.fn()

      let component1StateList

      const component1Decorator = connect((state) => {
        mapStateSpy1()

        return {
          list: state.list,
        }
      })

      const component1 = (props) => {
        const [state, setState] = React.useState({ list: props.list })

        component1StateList = state.list

        React.useEffect(() => {
          setState((prevState) => ({ ...prevState, list: props.list }))
        }, [props.list])

        renderSpy1()

        return <Component2 list={state.list} />
      }

      const Component1 = component1Decorator(component1)

      const mapStateSpy2 = jest.fn()
      const renderSpy2 = jest.fn()

      const component2Decorator = connect((state, ownProps) => {
        mapStateSpy2()

        return {
          mappedProp: ownProps.list.map((id) => state.byId[id]),
        }
      })

      const component2 = (props) => {
        renderSpy2()

        expect(props.list).toBe(component1StateList)

        return <div>Hello</div>
      }

      const Component2 = component2Decorator(component2)

      rtl.render(
        <ProviderMock store={store}>
          <Component1 />
        </ProviderMock>
      )

      // 1. Initial render
      expect(mapStateSpy1).toHaveBeenCalledTimes(1)

      // 1.Initial render
      // 2. C1 useEffect
      expect(renderSpy1).toHaveBeenCalledTimes(2)

      // 1. Initial render
      expect(mapStateSpy2).toHaveBeenCalledTimes(1)

      // 1. Initial render
      expect(renderSpy2).toHaveBeenCalledTimes(1)

      rtl.act(() => {
        store.dispatch({ type: 'FOO' })
      })

      // 2. Store dispatch
      expect(mapStateSpy1).toHaveBeenCalledTimes(2)

      // 3. Store dispatch
      // 4. C1 useEffect
      expect(renderSpy1).toHaveBeenCalledTimes(4)

      // 2. Connect(C2) subscriber
      // 3. Ignored prev child props in re-render and re-runs mapState
      expect(mapStateSpy2).toHaveBeenCalledTimes(3)

      // 2. Batched update from nested subscriber / C1 re-render
      expect(renderSpy2).toHaveBeenCalledTimes(2)
    })
  })
})
