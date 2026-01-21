import Daftar from "../../components/auth/daftar";
import RegisterNav from "../../components/Layout/RegisterNav";
import Footer from "../../components/Layout/Footer";
import { motion } from "framer-motion";

export default function DaftarPage() {
    return (
        <>
            <RegisterNav />

            {/* PAGE ENTER ANIMATION */}
            <motion.main
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.9,
                    ease: [0.22, 1, 0.36, 1], // smooth cinematic
                }}
            >
                <Daftar />
            </motion.main>
        </>
    );
}
