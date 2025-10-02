// components/icons/vehicle-icons/PickupIcon.tsx

const PickupIcon = ({ className = "w-6 h-6 text-white" }: { className?: string }) => {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="15.34" y1="16.77" x2="7.7" y2="16.77" stroke="currentColor" strokeWidth="1.91"/>
            <path d="M3.89,16.77H1.5V11.05h9.55V5.32h4.34a1.9,1.9,0,0,1,1.81,1.3l1.48,4.43,2.37.59a1.9,1.9,0,0,1,1.45,1.85v3.28H19.16" stroke="currentColor" strokeWidth="1.91"/>
            <circle cx="17.25" cy="16.77" r="1.91" stroke="currentColor" strokeWidth="1.91"/>
            <circle cx="5.8" cy="16.77" r="1.91" stroke="currentColor" strokeWidth="1.91"/>
            <line x1="13.91" y1="11.05" x2="18.68" y2="11.05" stroke="currentColor" strokeWidth="1.91"/>
        </svg>
    );
};

export default PickupIcon;
