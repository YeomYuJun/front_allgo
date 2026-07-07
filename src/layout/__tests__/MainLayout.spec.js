import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, it, expect, afterEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import MainLayout from '../MainLayout.vue'

const Stub = { template: '<div />' }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Stub },
      { path: '/:pathMatch(.*)*', component: Stub },
    ],
  })
}

let wrapper

async function mountAt(path) {
  const router = makeRouter()
  router.push(path)
  await router.isReady()
  wrapper = mount(MainLayout, {
    global: { plugins: [router] },
    attachTo: document.body,
  })
  return router
}

afterEach(() => { wrapper?.unmount() })

describe('MainLayout detail header', () => {
  it('renders 시안 header items instead of flat algorithm links', async () => {
    await mountAt('/bezier')
    const texts = wrapper.findAll('nav .navlinks > a').map((a) => a.text())
    expect(texts).toEqual(['Sortings', 'About', 'All visualizations →'])
    expect(wrapper.find('.algopanel').exists()).toBe(false)
    expect(wrapper.get('.algotrigger').attributes('aria-expanded')).toBe('false')
  })

  it('opens dropdown with 15 numbered algorithm links on trigger click', async () => {
    await mountAt('/bezier')
    await wrapper.get('.algotrigger').trigger('click')
    const items = wrapper.findAll('.algopanel a')
    expect(items).toHaveLength(15)
    expect(items[0].text()).toContain('01')
    expect(items[0].text()).toContain('Plotter')
    expect(items[14].text()).toContain('15')
    expect(items[14].text()).toContain('Sorting')
    expect(wrapper.get('.algotrigger').attributes('aria-expanded')).toBe('true')
  })

  it('marks the current route link active in the panel', async () => {
    await mountAt('/bezier')
    await wrapper.get('.algotrigger').trigger('click')
    const active = wrapper.findAll('.algopanel a.on')
    expect(active).toHaveLength(1)
    expect(active[0].text()).toContain('Bezier')
  })

  it('closes on Escape', async () => {
    await mountAt('/bezier')
    await wrapper.get('.algotrigger').trigger('click')
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(wrapper.find('.algopanel').exists()).toBe(false)
  })

  it('closes on outside click', async () => {
    await mountAt('/bezier')
    await wrapper.get('.algotrigger').trigger('click')
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await nextTick()
    expect(wrapper.find('.algopanel').exists()).toBe(false)
  })

  it('closes on route change', async () => {
    const router = await mountAt('/bezier')
    await wrapper.get('.algotrigger').trigger('click')
    await router.push('/fractal')
    await nextTick()
    expect(wrapper.find('.algopanel').exists()).toBe(false)
  })

  it('hides nav entirely on landing', async () => {
    await mountAt('/')
    expect(wrapper.find('nav').exists()).toBe(false)
  })
})
