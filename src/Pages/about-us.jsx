import GeneralSection from '../components/about-us/GeneralSection';
import TicketSystemSection from '../components/about-us/TicketSystemSection';
import ClientSection from '../components/about-us/ClientSection';
import PaymentSection from '../components/about-us/PaymentSection';
import WhyUsSection from '../components/about-us/WhyUsSection';
import Navbar from '../components/Layout/Navbar';
import Footer from '../components/Layout/Footer';


export default function AboutUsPage() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            <GeneralSection />
            <TicketSystemSection />
            <ClientSection />
            <PaymentSection />
            <WhyUsSection />
            <Footer />
        </main>
    );
}