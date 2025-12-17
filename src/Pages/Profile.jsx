import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Ambil user login
    useEffect(() => {
        const getUser = async () => {
            const { data } = await supabase.auth.getUser();

            if (!data.user) {
                navigate("/login"); // kalau belum login
                return;
            }

            setUser(data.user);
            setLoading(false);
        };

        getUser();
    }, [navigate]);

    // Logout
    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                {/* Title */}
                <h1 className="text-2xl font-bold text-center mb-6">
                    Profil Saya
                </h1>

                {/* Avatar */}
                <div className="flex justify-center mb-6">
                    <img
                        src={
                            user.user_metadata?.avatar_url ||
                            "https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff"
                        }
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover"
                    />
                </div>

                {/* Info */}
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Nama</span>
                        <span className="font-medium">
                            {user.user_metadata?.nama ||
                                user.user_metadata?.full_name ||
                                "-"}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Email</span>
                        <span className="font-medium">{user.email}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Tanggal Lahir</span>
                        <span className="font-medium">
                            {user.user_metadata?.tanggal_lahir || "-"}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-gray-500">Login via</span>
                        <span className="font-medium capitalize">
                            {user.app_metadata?.provider}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-8 space-y-3">
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-500 text-white rounded-xl py-3 font-medium hover:bg-red-600 transition"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
