import Orb from './components/Orb/Orb'

function App() {
    return (
        <div style={{ width: '100%', height: '100%' }}>
            <Orb
                hue={0}
                hoverIntensity={0.5}
                rotateOnHover={true}
            />
        </div>
    )
}

export default App
