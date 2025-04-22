import CircularLoader from "./loader/circular";

export const LoadingOverlay = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999]">
            <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                {/* <CircularLoader /> */}
            </div>
        </div>
    );
};
