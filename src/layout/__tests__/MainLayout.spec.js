import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, it, expect, afterEach } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import MainLayout from '../MainLayout.vue'
import { ALGOS } from '../../lib/landingAlgorithms.js'

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

  it('opens dropdown with all ALGOS entries numbered by their landing idx', async () => {
    await mountAt('/bezier')
    await wrapper.get('.algotrigger').trigger('click')
    const items = wrapper.findAll('.algopanel a')
    expect(items).toHaveLength(ALGOS.length)
    items.forEach((item, i) => {
      expect(item.text()).toContain(ALGOS[i].idx)
      expect(item.attributes('href')).toBe(ALGOS[i].route)
    })
    expect(items[3].text()).toContain('Monte Carlo')
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
