import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import RangeField from '../RangeField.vue'

describe('RangeField', () => {
  it('renders label and formatted value', () => {
    const w = mount(RangeField, { props: { modelValue: 1000, min: 100, max: 3000, label: 'Samples' } })
    expect(w.text()).toContain('Samples')
    expect(w.text()).toContain('1000')
  })

  it('emits update:modelValue as a number on input', async () => {
    const w = mount(RangeField, { props: { modelValue: 1000, min: 100, max: 3000, label: 'Samples' } })
    const input = w.get('input[type=range]')
    input.element.value = '1500'
    await input.trigger('input')
    expect(w.emitted('update:modelValue')[0]).toEqual([1500])
  })
})
